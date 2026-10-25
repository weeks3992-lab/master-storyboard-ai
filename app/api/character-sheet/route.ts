
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const projectTitle =
      typeof body?.projectTitle === "string" ? body.projectTitle.trim() : "";
    const logline =
      typeof body?.logline === "string" ? body.logline.trim() : "";
    const visualStyle =
      typeof body?.visualStyle === "string" ? body.visualStyle.trim() : "";
    const scenes = Array.isArray(body?.scenes)
      ? body.scenes.slice(0, 16)
      : [];

    if (!prompt && !logline && scenes.length === 0) {
      return NextResponse.json(
        { error: "Buat storyboard atau masukkan prompt cerita terlebih dahulu." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum diatur di Vercel." },
        { status: 500 }
      );
    }
    const base = (
  process.env.GEMINI_API_BASE ||
  "https://generativelanguage.googleapis.com/v1beta"
).replace(/\/$/, "");

   
    const model = process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash";

    const sceneSummary = scenes
      .map((scene: any, index: number) => {
        return `${index + 1}. ${scene?.title || `Adegan ${index + 1}`}: ${scene?.action || ""} ${scene?.continuity || ""} ${scene?.image_prompt || ""}`;
      })
      .join("\n");

    const instruction = `
You are a professional film character designer.
Analyze the story and identify all important recurring characters.
Generate ready-to-copy English image prompts, but DO NOT generate images.

Return valid JSON only:
{
  "characters": [
    {
      "name": "Character name",
      "role": "Story role",
      "appearance": "Physical description",
      "wardrobe": "Clothing description",
      "personality": "Personality and expression",
      "consistency_rules": ["Rule 1", "Rule 2"],
      "image_prompt": "Detailed character sheet prompt showing front, side, back, and close-up views of the same character",
      "negative_prompt": "Visual errors to avoid"
    }
  ]
}

Project: ${projectTitle}
Story: ${prompt}
Logline: ${logline}
Visual style: ${visualStyle}
Scenes:
${sceneSummary}
`;

    let response: Response;

    try {
      response = await fetch(
        `${base}/interactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            model,
            input: instruction,
            store: false,
          }),
          cache: "no-store",
        }
      );
    } catch {
      return NextResponse.json(
        { error: "Tidak bisa terhubung ke Gemini. Coba lagi nanti." },
        { status: 502 }
      );
    }

    const rawResponse = await response.text();
    let payload: any;

    try {
      payload = JSON.parse(rawResponse);
    } catch {
      return NextResponse.json(
        { error: `Respons Gemini tidak valid (HTTP ${response.status}).` },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const detail =
        payload?.error?.message || "Gemini gagal menghasilkan prompt.";
      return NextResponse.json(
        { error: `Gagal membuat prompt karakter: ${detail}` },
        { status: response.status }
      );
    }

    const text =
      payload?.output_text ||
      payload?.outputs
        ?.flatMap((item: any) => item?.content || [])
        ?.map((item: any) => item?.text || "")
        ?.join("") ||
      "";

    if (!text) {
      return NextResponse.json(
        { error: "Gemini tidak mengembalikan teks prompt." },
        { status: 502 }
      );
    }


    let result;
    try {
      result = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Respons Gemini bukan JSON yang valid. Coba lagi." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      characters: result.characters || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat prompt karakter." },
      { status: 500 }
    );
  }
}
