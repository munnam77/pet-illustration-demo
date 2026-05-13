import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type FeaturePoint = {
  part: "face" | "eyes" | "mouth" | "ear" | "body" | "paw" | "tail" | "fur";
  x: number;
  y: number;
};

const FALLBACK_FEATURES: FeaturePoint[] = [
  { part: "face", x: 0.5, y: 0.32 },
  { part: "eyes", x: 0.52, y: 0.34 },
  { part: "mouth", x: 0.5, y: 0.42 },
  { part: "body", x: 0.5, y: 0.6 },
  { part: "paw", x: 0.42, y: 0.78 },
  { part: "fur", x: 0.5, y: 0.55 },
];

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ features: FALLBACK_FEATURES, source: "fallback_no_key" });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "image required" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Locate body features of the pet in this image. Return strict JSON: {"features": [{"part": "face"|"eyes"|"mouth"|"ear"|"body"|"paw"|"tail"|"fur", "x": 0-1, "y": 0-1}], "pet_kind": "dog"|"cat"|"other"}. Coordinates are normalized 0-1 from the top-left of the image. Locate at minimum: face, eyes, mouth, body center, and one paw. Add tail, ear, fur if clearly visible.',
            },
            { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
    });

    const text = res.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);
    const features: FeaturePoint[] = Array.isArray(parsed.features) && parsed.features.length > 0
      ? parsed.features.filter(
          (f: FeaturePoint) =>
            typeof f.x === "number" &&
            typeof f.y === "number" &&
            f.x >= 0 && f.x <= 1 && f.y >= 0 && f.y <= 1,
        )
      : FALLBACK_FEATURES;

    return NextResponse.json({
      features,
      pet_kind: parsed.pet_kind || "unknown",
      source: "vision",
    });
  } catch (err) {
    console.error("[analyze] error", err);
    return NextResponse.json({ features: FALLBACK_FEATURES, source: "fallback_on_error" });
  }
}
