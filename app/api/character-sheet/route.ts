
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    let body: any;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Data permintaan tidak valid. Coba lagi." },
        { status: 400 }
      );
    }

    const prompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const projectTitle =
      typeof body?.projectTitle === "string"
        ? body.projectTitle.trim()
        : "";
    const logline =
      typeof body?.logline === "string" ? body.logline.trim() : "";
    const visualStyle =
      typeof body?.visualStyle === "string"
        ? body.visualStyle.trim()
        : "";
    const scenes = Array.isArray(body?.scenes)
      ? body.scenes.slice(0, 10)
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

    const model =
      process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash";

    const sceneSummary = scenes
      .map((scene: any, index: number) => {
        const title =
          typeof scene?.title === "string"
            ? scene.title
            : `Scene ${index + 1}`;
        const action =
          typeof scene?.action === "string" ? scene.action : "";
        const continuity =
          typeof scene?.continuity === "string"
            ? scene.continuity
            : "";
        const imagePrompt =
          typeof scene?.image_prompt === "string"
            ? scene.image_prompt
            : "";

        return `${index + 1}. ${title}: ${action} ${continuity} ${imagePrompt}`;
      })
      .join("\n")
      .slice(0, 6000);

    const instruction = `
You are a professional film character designer.
Analyze the story and identify its important named or recurring characters.
Generate text prompts only. Never generate or return images.

Return valid JSON with this structure:
{
  "characters": [
    {
      "name": "Character name",
      "role": "Story role",
      "appearance": "Physical appearance",
      "wardrobe": "Clothing and accessories",
      "personality": "Personality and expressions",
      "consistency_rules": ["Rule 1", "Rule 2"],
      "image_prompt": "Detailed English prompt for a character reference sheet showing front, side, back, and close-up views of the same character",
      "negative_prompt": "Visual errors to avoid"
    }
  ]
}

Identify multiple important characters when the story supports them.
Keep appearance, wardrobe, and cultural details consistent with the story.
Do not invent facts that contradict the source.
Keep the response concise and valid JSON.

Project: ${projectTitle}
Story: ${prompt.slice(0, 5000)}
Logline: ${logline.slice(0, 1500)}
Visual style: ${visualStyle.slice(0, 1000)}
Storyboard scenes:
${sceneSummary}
`;

    let response: Response;

    try {
      response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
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
          signal: AbortSignal.timeout(25000),
        }
      );
    } catch (error) {
      const timedOut =
        error instanceof Error && error.name === "TimeoutError";

      return NextResponse.json(
        {
          error: timedOut
            ? "Gemini terlalu lama merespons. Coba lagi beberapa saat."
            : "Tidak bisa terhubung ke Gemini. Periksa koneksi dan coba lagi.",
        },
        { status: timedOut ? 504 : 502 }
      );
    }

    const raw = await response.text();
    let payload: any;

    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: `Respons Gemini bukan JSON yang valid (HTTP ${response.status}).` },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const detail =
        payload?.error?.message ||
        `Gemini mengembalikan status ${response.status}.`;

      return NextResponse.json(
        { error: `Gagal membuat prompt karakter: ${detail}` },
        { status: response.status >= 400 && response.status <= 599
          ? response.status
          : 502 }
      );
    }

    const stepText = Array.isArray(payload?.steps)
      ? payload.steps
          .filter((step: any) => step?.type === "model_output")
          .flatMap((step: any) =>
            Array.isArray(step?.content) ? step.content : []
          )
          .filter((item: any) => item?.type === "text")
          .map((item: any) => item.text || "")
          .join("")
      : "";

    const text =
      payload?.output_text ||
      stepText ||
      "";

    if (!text.trim()) {
      return NextResponse.json(
        {
          error:
            "Gemini belum mengembalikan teks. Periksa respons API atau coba lagi.",
        },
        { status: 502 }
      );
    }

    let result: any;

    try {
      const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

      result = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Hasil Gemini bukan JSON valid. Coba lagi." },
        { status: 502 }
      );
    }

    if (!Array.isArray(result?.characters)) {
      return NextResponse.json(
        { error: "Hasil Gemini tidak memiliki daftar characters yang valid." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      characters: result.characters,
    });
  } catch (error) {
    console.error("Character prompt route error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server saat membuat prompt karakter." },
      { status: 500 }
    );
  }
}
