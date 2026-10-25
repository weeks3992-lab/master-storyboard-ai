
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

    const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
    const sceneSummary = scenes
      .map((scene: any, index: number) => {
        const title = scene?.title || `Adegan ${index + 1}`;
        const action = scene?.action || "";
        const continuity = scene?.continuity || "";
        const imagePrompt = scene?.image_prompt || "";
        return `${index + 1}. ${title}: ${action} ${continuity} ${imagePrompt}`;
      })
      .join("\n");

    const instruction = `
You are a professional film character designer.

Analyze the story and identify its important named or recurring characters.
Generate a ready-to-copy English image-generation prompt for each character.
Do NOT generate images.

For each character return:
- name
- role
- appearance
- wardrobe
- personality
- consistency_rules (array of strings)
- image_prompt (a detailed prompt for a character reference sheet showing front, side, back, and face close-up views of the SAME character)
- negative_prompt

Keep characters consistent with the story and visual style.
Do not invent details that contradict the story.
Return valid JSON only in this structure:
{
  "characters": [
    {
      "name": "Character name",
      "role": "Story role",
      "appearance": "Physical description",
      "wardrobe": "Clothing description",
      "personality": "Personality and expression",
      "consistency_rules": ["Rule 1"],
      "image_prompt": "Complete English image prompt",
      "negative_prompt": "Visual errors to avoid"
    }
  ]
}

Project title: ${projectTitle}
Story prompt: ${prompt}
Logline: ${logline}
Visual style: ${visualStyle}
Storyboard scenes:
${sceneSummary}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: instruction }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        }),
        cache: "no-store",
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      const detail =
        payload?.error?.message || "Gemini gagal menghasilkan prompt.";
      return NextResponse.json(
        { error: `Gagal membuat prompt karakter: ${detail}` },
        { status: response.status }
      );
    }

    const text =
      payload?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text || "")
        .join("") || "";

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
