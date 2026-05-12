import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const NO_TEXT_RULE = `ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO JAPANESE CHARACTERS, NO SPEECH BUBBLES, NO HANDWRITTEN ANNOTATIONS anywhere in the image. The illustration must be of the pet only on a clean background. Do not add any captions, labels, signs, or written content. The image will be composited with editable text overlays externally.`;

const STYLE_PROMPTS: Record<string, string> = {
  watercolor: `Transform this real pet photo into a soft, hand-drawn watercolor illustration in a warm Japanese kawaii style. CRITICAL — preserve the pet's exact individual features: fur color and pattern, ear shape, eye color and expression, body proportions, posture, and any distinguishing marks. Render as a gentle watercolor and pencil sketch on warm cream paper. Soft pastel palette. Subtle paper grain. Cozy aesthetic suitable for a veterinary clinic's daily update to pet owners. Plain cream/ivory background. ${NO_TEXT_RULE}`,

  anime: `Transform this real pet photo into a clean Japanese anime / manga style illustration. CRITICAL — preserve the pet's exact individual features: fur color and pattern, ear shape, eye color and shape, body proportions, posture, and distinguishing marks. Clean line work, gentle cel-shading, warm soft palette. Wholesome and friendly. Plain cream background. ${NO_TEXT_RULE}`,

  picturebook: `Transform this real pet photo into a children's picture-book illustration style — soft crayon and gouache textures, gentle outlines, warm rounded shapes. CRITICAL — preserve the pet's exact individual features: fur color and pattern, ear shape, eye color, body proportions, posture, distinguishing marks. Cozy palette of cream, soft brown, dusty pink. Plain pastel background. ${NO_TEXT_RULE}`,
};

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

    const result = await client.images.edit({
      model: "gpt-image-1",
      image: uploadable,
      prompt,
      size: "1024x1024",
      quality: "high",
      input_fidelity: "high",
      stream: false,
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "no image returned by model" }, { status: 502 });
    }

    return NextResponse.json({
      imageDataUrl: `data:image/png;base64,${b64}`,
      style,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[generate] error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
