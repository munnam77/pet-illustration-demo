import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ allowed: true, reason: "no_key_skip" });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "image file required" }, { status: 400 });
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
              text: 'Check if this photo is appropriate for a veterinary clinic\'s pet illustration service. Return strict JSON: {"is_pet": boolean, "pet_kind": "dog"|"cat"|"other"|"none", "has_human_face": boolean, "is_appropriate": boolean, "reason_ja": string}',
            },
            { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
    });

    const text = res.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);
    const allowed =
      parsed.is_pet === true &&
      parsed.is_appropriate !== false &&
      parsed.has_human_face !== true;
    return NextResponse.json({
      allowed,
      pet_kind: parsed.pet_kind,
      reason_ja:
        parsed.reason_ja ||
        (allowed ? "ペットのお写真として問題ありません。" : "ペット以外が写っているようです。"),
    });
  } catch (err) {
    console.error("[screen] error", err);
    return NextResponse.json({ allowed: true, reason: "screen_skipped_on_error" });
  }
}
