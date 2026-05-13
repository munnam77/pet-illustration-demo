import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 600;
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === CLIENT REQUIREMENT (kitano-snc / 株式会社サスティナ, 2026-05-13) ===
// 「写真をそのまま使うのではなく、手書き風イラストへ変換するのが前提」
// "The photo must be converted into a hand-drawn illustration, not kept as-is."
// 「写真のペットさん本人に見えるよう、個体の特徴を保ちながらイラスト化」
// "The illustration must look like THE specific pet — preserve breed, fur color, ears, body, expression."
// 「トイプードルと柴犬の区別がつく、茶トラと黒トラの区別がつく、というレベルは最低限」
// Breed/coat-pattern recognition is the minimum bar.
//
// Reference techniques suggested by client: img2img, ControlNet, IP-Adapter, Gemini Image (nano-banana).
// In this prototype we use OpenAI gpt-image-2's image.edit (img2img) because it is the only
// production-stable identity-preserving image model with an API right now; gpt-image-1 acts as fallback
// with `input_fidelity: "high"`.
//
// The HTML layer adds bubbles / text / arrows / title — the AI image must leave the pet centered
// with empty margin space so the overlay system has room to breathe.

const IDENTITY_PRESERVATION_RULES = `
CRITICAL — PRESERVE THIS SPECIFIC PET'S IDENTITY:
The owner of this pet must look at the result and instantly say "あ、うちの子だ！" ("Oh, that's MY pet!").
A generic "brown dog" or "tabby cat" illustration is REJECTED. You must match:
- BREED / SPECIES: toy poodle stays toy poodle (curly coat, round face); shiba stays shiba (pointed ears, foxy face). NEVER substitute.
- COAT COLOR & PATTERN: dark grey poodle stays dark grey (not brown). Brown tabby stripes stay brown (not black tabby).
- DISTINCTIVE MARKINGS: white chest, eye masks, paw socks, spots, freckles — copy them exactly to the illustration.
- EAR SHAPE: floppy, pointed, curled, cropped — preserve.
- BODY PROPORTIONS: stocky vs slim, short-legged vs long-legged — preserve.
- FACIAL EXPRESSION & GAZE: looking at camera, looking away, tongue out, sleepy eyes — preserve.
- POSE: sitting, lying down, head tilted — preserve roughly so the illustration feels like the same moment.`;

const COMPOSITION_RULES = `
COMPOSITION:
- Output: a single hand-drawn pet PORTRAIT illustration.
- Pet occupies ~55–65% of the canvas, roughly centered, head/face in the upper-middle region.
- Background: soft warm cream paper (#fdf6e8 ish) with subtle paper grain — NO complex environment, NO furniture clutter, NO replicated sofa pattern. The original real-world background should be replaced with this cream paper.
- Leave the CORNERS and MARGIN AREAS visually quiet — small bands of empty cream space on left/right/top/bottom — because HTML bubbles, arrows, and decorations will be composited on top.
- No frames, no borders, no torn-paper edges in the AI output — those are HTML.`;

const FORBIDDEN_RULES = `
FORBIDDEN — IF YOU INCLUDE ANY OF THESE, THE OUTPUT IS REJECTED:
- ANY speech bubbles, callout clouds, sticky notes, banners, label boxes, scalloped clouds, or shapes that could contain text.
- ANY letters, numbers, kana, kanji, or text of ANY language anywhere in the image.
- ANY additional animals, mascots, humans, or human body parts.
- The original photograph rendered as-is (this MUST be an illustrated/hand-drawn version, not the photo).
- Heavy digital gradients, glossy plastic 3D, vector-perfect curves, AI-art-generic look, "stock illustration" cliché.
- Saturated commercial cartoon colors. Keep palette soft and natural.`;

const STYLE_DESCRIPTIONS: Record<string, string> = {
  watercolor: `STYLE: Soft Japanese watercolor (水彩) illustration.
- Gentle watercolor washes with visible paper grain.
- Thin warm-grey or soft-brown outline (hand-drawn pen feel, slight wobble).
- Colors slightly desaturated, warm tonality.
- Edges of color slightly soft (watercolor bleed at fur outline).
- Mood: warm, tender, like a vet's note card.`,

  anime: `STYLE: Clean kawaii anime illustration.
- Smooth anime line-art with cel-shaded color blocks (2–3 tones per region).
- Slightly enlarged expressive eyes (but still recognizably the pet's eye color and shape).
- Soft pastel palette, gentle blush highlights.
- Mood: cute but tasteful — NOT chibi, NOT mascot-like.`,

  picturebook: `STYLE: Japanese children's picturebook (絵本) illustration.
- Soft pencil-sketch outline with gentle color-pencil fills.
- Slightly grainy/textured shading.
- Warm earth-tone palette.
- Mood: like a page from a wholesome Japanese picturebook for ages 3–6.`,

  crayon: `STYLE: Crayon-on-paper (クレヨン画) illustration.
- Visible waxy crayon stroke texture; slightly imperfect lines.
- Soft mid-saturation colors layered with crayon shading marks.
- Casual, hand-made feel.
- Mood: like a thoughtful child's drawing — skilled but unrefined.`,

  simple: `STYLE: Minimal Japanese line-art portrait.
- Single thin ink line outline (warm dark brown), no rendering.
- Optional VERY subtle single flat wash of muted color for the pet body — or pure line only.
- Generous empty cream paper.
- Mood: refined, elegant, restrained — sophisticated stationery aesthetic.`,
};

const MODEL_CANDIDATES = [
  { name: "gpt-image-2", extra: {} as Record<string, unknown> },
  { name: "gpt-image-1", extra: { input_fidelity: "high" } as Record<string, unknown> },
] as const;

function buildPrompt(style: string) {
  const styleDesc = STYLE_DESCRIPTIONS[style] ?? STYLE_DESCRIPTIONS.watercolor;
  return `You are a master Japanese illustrator producing a single soft hand-drawn pet portrait for a Japanese veterinary clinic's "本日のご様子" (today's update) daily report card.

GOAL: Take the input photograph of a pet and produce a hand-drawn illustrated version of THE SAME individual pet.

${IDENTITY_PRESERVATION_RULES}

${styleDesc}

${COMPOSITION_RULES}

${FORBIDDEN_RULES}

Now produce the illustration.`;
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing OPENAI_API_KEY." },
      { status: 500 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const style = (formData.get("style") as string) || "watercolor";
    const logoFile = formData.get("logo");
    const prompt = buildPrompt(style);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "image file is required" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "image must be under 10 MB" }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Normalize to a 1024-wide portrait-ish PNG; gpt-image-2 accepts 1024x1024,
    // 1024x1536, 1536x1024. Portrait 3:4 best fits our ReportCard canvas.
    const normalized = await sharp(rawBuffer)
      .rotate()
      .resize(1024, 1536, { fit: "cover", position: "attention" })
      .png()
      .toBuffer();

    const uploadable = await toFile(normalized, "pet.png", { type: "image/png" });

    let usedModel: string | null = null;
    let lastErr: unknown = null;
    let b64: string | undefined;

    for (const candidate of MODEL_CANDIDATES) {
      try {
        const baseParams: Record<string, unknown> = {
          model: candidate.name,
          image: uploadable,
          prompt,
          size: "1024x1536",
          quality: "medium",
          stream: false,
          ...candidate.extra,
        };
        const result = (await client.images.edit(
          baseParams as unknown as Parameters<typeof client.images.edit>[0],
        )) as unknown as { data?: Array<{ b64_json?: string }> };
        b64 = result.data?.[0]?.b64_json;
        if (b64) {
          usedModel = candidate.name;
          break;
        }
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : String(e);
        const status = (e as { status?: number })?.status;
        const retryable =
          status === 404 ||
          status === 400 ||
          /not.?found|does.?not.?exist|invalid.*model|does not support|unsupported/i.test(msg);
        if (!retryable) throw e;
        console.warn(`[generate] model ${candidate.name} failed, trying fallback:`, msg);
      }
    }

    if (!b64) {
      const msg = lastErr instanceof Error ? lastErr.message : "no image returned by any model";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    let finalBytes: Uint8Array = new Uint8Array(Buffer.from(b64, "base64"));

    // Server-side logo composite (clinic-controlled). Owner-selectable on/off
    // is handled UI-side by simply skipping the logoFile FormData entry.
    if (logoFile instanceof File && logoFile.size > 0) {
      try {
        const logoBuf = new Uint8Array(await logoFile.arrayBuffer());
        const logoResized = await sharp(logoBuf)
          .resize(180, 180, { fit: "inside" })
          .png()
          .toBuffer();
        finalBytes = new Uint8Array(
          await sharp(finalBytes)
            .composite([
              {
                input: logoResized,
                gravity: "southeast",
                blend: "over",
              },
            ])
            .png()
            .toBuffer(),
        );
      } catch (e) {
        console.warn("[generate] logo composite failed, returning without logo:", e);
      }
    }

    const outB64 = Buffer.from(finalBytes).toString("base64");

    return NextResponse.json({
      imageDataUrl: `data:image/png;base64,${outB64}`,
      style,
      model: usedModel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[generate] error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
