import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import sharp from "sharp";

export const runtime = "nodejs";
// Vercel Pro plan allows up to 800s for serverless functions; gpt-image-2
// typically returns in 4-5 minutes. 600s gives comfortable headroom.
export const maxDuration = 600;
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const KEEP_PHOTO_RULE = `ABSOLUTE TOP-PRIORITY RULE: The pet itself MUST remain a real photograph — do NOT redraw, repaint, stylize, or convert the pet. Keep the pet's actual photographic fur texture, lighting, shadows, eyes, and pose EXACTLY as in the input image. Only add hand-drawn illustration decorations AROUND the pet (margins, corners, empty space, background areas). If you cannot add decorations without altering the pet, leave the pet untouched. Output must still feel like a real photo with cute decorative overlays — not a stylized illustration.`;

// Bubbles must be transparent (white interior, thin outline only) — see client's
// reference image IMG_7948 where bubbles are white/cream with thin handwritten
// outline and a small colored accent dot. NO solid pastel fills.
const TRANSPARENT_BUBBLE_RULE = `Speech bubbles MUST have a clean WHITE or near-white interior — NOT colored pastel fills. The bubbles should look like crisp white note cards with a thin hand-drawn ink outline, optionally with a tiny colored accent dot (pink, mint, or peach) at the top-left corner of each bubble — but the INSIDE of every bubble must remain plain WHITE or very light cream, so text can be read clearly when overlaid externally. NO solid pink/mint/peach background fills inside the bubble shapes. Think: handwritten white sticky-note look, not colored speech-bubble look.`;

const STYLE_PROMPTS: Record<string, string> = {
  watercolor: `Take this real pet photograph and add cute hand-drawn watercolor illustration overlays on top of it — in the style of a Japanese veterinary clinic's "今日のご様子" daily update greeting card for the pet owner. Add: (1) 4-6 hand-drawn speech bubble shapes with WHITE INTERIORS and thin hand-drawn black/brown ink outlines, scattered around the pet (LEAVE THEM EMPTY — no text inside, text will be added externally). Each bubble may have a tiny colored accent dot (pink, mint, or peach) at its top-left corner but the bubble FILL must be WHITE. (2) Small hand-drawn paw print stamps scattered in empty corners (paw prints can use light cream/beige ink). (3) Tiny hand-drawn heart shapes in pink. (4) A soft warm cream/beige watercolor frame around the edges of the image. (5) A thin handwritten-style decorative border. ${KEEP_PHOTO_RULE} ${TRANSPARENT_BUBBLE_RULE}`,

  anime: `Take this real pet photograph and add cute hand-drawn anime-style sticker decorations on top of it. Add: (1) 4-6 round empty speech bubble outlines with WHITE INTERIORS and thin black outlines (leave empty — no text), each bubble may have a tiny colored accent dot at the corner. (2) Small star sparkle marks ✨ in corners. (3) Cute heart shapes. (4) Playful colorful sticker-style decorations around the edges. (5) A soft white border frame. ${KEEP_PHOTO_RULE} ${TRANSPARENT_BUBBLE_RULE}`,

  picturebook: `Take this real pet photograph and add hand-drawn children's picturebook style decorations on top of it: (1) 4-6 cloud-shaped speech bubbles with WHITE/CREAM interiors and hand-drawn outlines (leave empty — no text inside). (2) Hand-drawn crayon-style paw prints. (3) Small flowers and hearts around corners. (4) A warm picturebook-style border. ${KEEP_PHOTO_RULE} ${TRANSPARENT_BUBBLE_RULE}`,
};

// gpt-image-2 is the preferred model for this use case — its photo preservation
// is dramatically better, matching the client's reference image style. Typical
// generation time: 4-5 minutes. Requires Vercel Pro (300-800s function limit).
// gpt-image-1 is kept as a safety fallback (~60s, partial pet stylization).
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
          quality: "high",
          stream: false,
        };
        // input_fidelity is supported on gpt-image-1 only — keeps the source
        // photograph intact. gpt-image-2 rejects this parameter.
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

    return NextResponse.json({
      imageDataUrl: `data:image/png;base64,${b64}`,
      style,
      model: usedModel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[generate] error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
