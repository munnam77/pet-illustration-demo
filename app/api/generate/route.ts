import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 600;
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Reference image: a Japanese vet clinic's "本日のご様子" photo card —
// real photo of a dark toy poodle on a beige blanket, with delicate hand-drawn
// accents (small paw prints in faded brown ink, tiny open-outline pink hearts,
// soft cream torn-paper edge border). Bubbles/text are HTML overlays.
// Key failure modes: AI tends to (a) over-decorate, (b) use commercial sticker
// styling, (c) modify the pet, (d) add bubbles. The prompts below explicitly
// forbid each of these.

const KEEP_PHOTO_RULE = `ABSOLUTE TOP-PRIORITY RULE — DO NOT MODIFY THE PET OR BACKGROUND: The input is a real photograph and the pet (every pixel of fur, eyes, paws, body, pose) and the background (blanket, sofa, lighting, shadows) MUST remain BYTE-FOR-BYTE identical to the input photo. You are NOT redrawing, stylizing, illustrating, repainting, or "enhancing" anything in the photo. Imagine yourself as a Japanese vet clinic nurse who PRINTED OUT the photo on cream paper, then took a real ink pen and stamped a few small decorations in the empty margins. That is your only job. If a decoration would touch or alter the pet or background, DO NOT add it.`;

const NO_BUBBLES_RULE = `DO NOT draw ANY of the following INSIDE the image: speech bubbles, callout bubbles, dialogue clouds, sticky notes, banners, signs, label boxes, rectangular text containers, scalloped clouds, or ANY bordered shape that could contain text. Also do NOT add ANY letters, numbers, kana, kanji, or text of any language. These elements are added externally via HTML overlays — your image must leave the area around the pet completely OPEN for HTML bubbles to be placed on top.`;

const RESTRAINT_RULE = `RESTRAINT IS CRITICAL — LESS IS MORE: The reference aesthetic is delicate Japanese stationery, NOT commercial vinyl stickers. Use FEWER, SMALLER, MORE FADED decorations. Each paw print should be no larger than ~4% of canvas width. Total decoration count should not exceed ~10 items combined. Empty margin space is BEAUTIFUL and DESIRED — do NOT fill every corner. Colors must be FADED and DESATURATED (faded cream, dusty pink, pale yellow) — NEVER vivid or saturated. Lines must look HAND-DRAWN with slight wobble and imperfection — NEVER digital, NEVER vector-clean, NEVER gradient-filled.`;

const FORBID_DIGITAL_LOOK = `FORBIDDEN: digital gradients, vector-perfect curves, saturated cartoon colors, mascot characters, additional animals, glossy shadows, 3D effects, lens flares, "AI-art" looking elements. EVERY non-photo element must look like REAL INK FROM A REAL PEN OR STAMP on REAL PAPER.`;

const STYLE_PROMPTS: Record<string, string> = {
  watercolor: `You are adding minimal hand-drawn accents to a real pet photograph, mimicking the aesthetic of a Japanese veterinary clinic's "本日のご様子" (today's update) daily report card.

ADD ONLY THESE ELEMENTS, NOTHING ELSE:
1. EXACTLY 4-5 small paw print stamps (one in each corner, plus 1 optional along an edge). Each paw print: ~3% of canvas width, simple shape (1 pad + 4 toe dots), color = faded warm cream/beige ink (#D4B896 or #B8956E), looks like a slightly-faded real rubber stamp.
2. EXACTLY 3 tiny OPEN-OUTLINE hearts (NOT filled hearts — just thin line outlines). Color = soft dusty pink (#F5B7C5). Size = ~2% of canvas width. Lines slightly wobbly like real pen.
3. EXACTLY 2 tiny accent marks — small 5-petal flower outlines or simple star outlines in pale yellow (#F5D578) or pink. Tiny, ~1.5% of canvas width.
4. A thin SOFT CREAM/IVORY torn-paper edge border (only 4-6 pixel thickness) around all four edges, semi-transparent. This softens the photo edges but does NOT cover the pet.

${KEEP_PHOTO_RULE}
${NO_BUBBLES_RULE}
${RESTRAINT_RULE}
${FORBID_DIGITAL_LOOK}`,

  anime: `Add minimal hand-drawn anime-stationery accents to this real pet photograph. ADD ONLY:
1. EXACTLY 3-4 small star sparkle outlines (✦ outline shape, not filled) in soft pastel pink or pale yellow, ~2-3% of canvas width each, scattered in corners.
2. EXACTLY 3 tiny open-outline hearts (thin pen line, dusty pink #F5B7C5).
3. EXACTLY 2-3 tiny dot accents in soft pastel.
4. Thin soft-white torn-paper edge border (4-6px).

${KEEP_PHOTO_RULE}
${NO_BUBBLES_RULE}
${RESTRAINT_RULE}
${FORBID_DIGITAL_LOOK}`,

  picturebook: `Add minimal hand-drawn picturebook accents to this real pet photograph, like soft pencil illustrations on cream paper. ADD ONLY:
1. EXACTLY 4 small paw prints, drawn as if with a soft pencil (slight grain texture), in warm earth-tone brown.
2. EXACTLY 3 tiny open-outline hearts, pencil-drawn dusty pink.
3. EXACTLY 2 tiny picturebook flowers (simple outline, ~5 petals) in soft pastel.
4. Thin warm cream torn-paper border (4-6px).

${KEEP_PHOTO_RULE}
${NO_BUBBLES_RULE}
${RESTRAINT_RULE}
${FORBID_DIGITAL_LOOK}`,

  crayon: `Add minimal hand-drawn crayon-style accents to this real pet photograph, like a child's casual drawing on top of a printed photo. ADD ONLY:
1. EXACTLY 4 small crayon-textured paw prints (slight waxy crayon texture visible), in warm earth tones — not bright primary colors.
2. EXACTLY 3 tiny open-outline crayon hearts in soft pink.
3. EXACTLY 2-3 tiny crayon dot/star accents.
4. A thin crayon-textured cream border (4-6px), slightly imperfect line.

${KEEP_PHOTO_RULE}
${NO_BUBBLES_RULE}
${RESTRAINT_RULE}
${FORBID_DIGITAL_LOOK}`,

  simple: `Add ULTRA-MINIMAL elegant line-art accents to this real pet photograph. The aesthetic is sophisticated Japanese stationery — extreme restraint. ADD ONLY:
1. EXACTLY 3-4 small paw print outlines (just simple line drawings, no fill), in thin black or dark brown ink, ~3% of canvas width.
2. EXACTLY 2 tiny open-outline hearts, single thin line.
3. A single thin clean line frame around the four edges (2-3px), in muted brown ink.

${KEEP_PHOTO_RULE}
${NO_BUBBLES_RULE}
${RESTRAINT_RULE}
${FORBID_DIGITAL_LOOK}`,
};

// Optional pre-screen: reject obviously non-pet images cheaply via gpt-image-2
// rejection is implicit when the model refuses. For a low-cost first-pass we
// rely on OpenAI's built-in moderation + content policy of images.edit, which
// raises a 400 if the image violates policy or is clearly off-topic.
// (Full pet-classifier vision call is documented in the proposal as MVP+.)

const MODEL_CANDIDATES = ["gpt-image-2", "gpt-image-1"] as const;

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
    const clinicName = (formData.get("clinicName") as string) || "";
    const prompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.watercolor;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "image file is required" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "image must be under 10 MB" }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    const normalized = await sharp(rawBuffer)
      .rotate()
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: false })
      .png()
      .toBuffer();

    const uploadable = await toFile(normalized, "pet.png", { type: "image/png" });

    let usedModel: string | null = null;
    let lastErr: unknown = null;
    let b64: string | undefined;

    for (const model of MODEL_CANDIDATES) {
      try {
        const baseParams: Record<string, unknown> = {
          model,
          image: uploadable,
          prompt,
          size: "1024x1024",
          quality: "medium",
          stream: false,
        };
        if (model === "gpt-image-1") {
          baseParams.input_fidelity = "high";
        }
        const result = (await client.images.edit(
          baseParams as unknown as Parameters<typeof client.images.edit>[0],
        )) as unknown as { data?: Array<{ b64_json?: string }> };
        b64 = result.data?.[0]?.b64_json;
        if (b64) {
          usedModel = model;
          break;
        }
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : String(e);
        const status = (e as { status?: number })?.status;
        const retryable =
          status === 404 ||
          status === 400 ||
          /not.?found|does.?not.?exist|invalid.*model|does not support/i.test(msg);
        if (!retryable) throw e;
        console.warn(`[generate] model ${model} failed, trying fallback:`, msg);
      }
    }

    if (!b64) {
      const msg = lastErr instanceof Error ? lastErr.message : "no image returned by any model";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    let finalBytes: Uint8Array = new Uint8Array(Buffer.from(b64, "base64"));

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

    if (clinicName) {
      try {
        const svgBadge = Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="56">
            <rect x="0" y="0" width="380" height="56" rx="28" fill="rgba(255,255,255,0.86)" stroke="rgba(59,42,31,0.18)"/>
            <text x="190" y="36" font-size="22" text-anchor="middle" font-family="'Hiragino Sans','Noto Sans JP',sans-serif" fill="#3b2a1f">${escapeXml(clinicName)}</text>
          </svg>`,
        );
        finalBytes = new Uint8Array(
          await sharp(finalBytes)
            .composite([{ input: svgBadge, gravity: "southwest" }])
            .png()
            .toBuffer(),
        );
      } catch (e) {
        console.warn("[generate] clinic name badge failed:", e);
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

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );
}
