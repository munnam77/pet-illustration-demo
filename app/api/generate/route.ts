import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 600;
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const KEEP_PHOTO_RULE = `ABSOLUTE TOP-PRIORITY RULE: The pet itself MUST remain a real photograph — do NOT redraw, repaint, stylize, or convert the pet. Keep the pet's actual photographic fur texture, lighting, shadows, eyes, and pose EXACTLY as in the input image. Only add hand-drawn illustration decorations AROUND the pet (margins, corners, empty space, background areas). If you cannot add decorations without altering the pet, leave the pet untouched. Output must still feel like a real photo with cute decorative overlays — not a stylized illustration.`;

const NO_BUBBLES_RULE = `DO NOT draw any speech bubbles, talk bubbles, dialogue bubbles, callout shapes, sticky notes, signs, callouts, banners, label boxes, or any kind of bordered text container shape inside the image. Leave the area around the pet completely open and free of bubble-shaped or rectangular containers — those will be added externally as HTML overlays. Empty space around the pet should remain as pure photographic background and decorative frame, NOTHING ELSE.`;

const STYLE_PROMPTS: Record<string, string> = {
  watercolor: `Take this real pet photograph and add cute hand-drawn watercolor illustration decorations AROUND THE EDGES ONLY — in the style of a Japanese veterinary clinic's "今日のご様子" daily update greeting card. Add ONLY: (1) small hand-drawn paw print stamps scattered in the corners in light cream/beige watercolor ink, (2) tiny hand-drawn heart shapes in soft pink around the corners, (3) a soft warm cream/beige watercolor frame border around the four edges with a slightly torn-paper texture, (4) a few tiny scattered flower motifs in the corners. Keep the CENTER clean — pure photograph of the pet. ${KEEP_PHOTO_RULE} ${NO_BUBBLES_RULE}`,

  anime: `Take this real pet photograph and add cute hand-drawn anime-style sticker decorations AROUND THE EDGES ONLY. Add ONLY: (1) small star sparkle marks ✨ in the corners, (2) cute heart shapes in the corners, (3) playful tiny sticker-style decorations (small flowers, swirls, small dots), (4) a soft white border frame. Keep the CENTER clean. ${KEEP_PHOTO_RULE} ${NO_BUBBLES_RULE}`,

  picturebook: `Take this real pet photograph and add hand-drawn children's picturebook style decorations AROUND THE EDGES ONLY: (1) hand-drawn crayon-style paw prints in the corners, (2) small flowers and hearts around the corners, (3) a warm picturebook-style border with crayon texture. Keep the CENTER clean. ${KEEP_PHOTO_RULE} ${NO_BUBBLES_RULE}`,

  crayon: `Take this real pet photograph and add hand-drawn crayon-style decorations AROUND THE EDGES ONLY: (1) crayon-drawn paw prints in vibrant colors at the four corners, (2) crayon-drawn hearts and stars scattered along the edges, (3) a hand-drawn crayon border with visible wax texture and slight imperfections like a kindergarten drawing, (4) cheerful primary-color accents. Keep the CENTER clean. ${KEEP_PHOTO_RULE} ${NO_BUBBLES_RULE}`,

  simple: `Take this real pet photograph and add minimal, elegant line-art decorations AROUND THE EDGES ONLY: (1) thin black ink paw print outlines in the corners, (2) simple heart outlines, (3) a clean thin line frame, (4) restrained, sophisticated, single-line illustration style with plenty of whitespace. Keep the CENTER clean. ${KEEP_PHOTO_RULE} ${NO_BUBBLES_RULE}`,
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
