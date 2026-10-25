import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function findImageData(payload: any): { data: string; mimeType: string } | null {
  const seen = new Set<any>();
  const visit = (value: any): { data: string; mimeType: string } | null => {
    if (!value || typeof value !== "object" || seen.has(value)) return null;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = visit(item);
        if (found) return found;
      }
      return null;
    }
    const data = value.data || value.image?.data || value.inline_data?.data || value.inlineData?.data;
    const mimeType = value.mime_type || value.mimeType || value.image?.mime_type || value.inline_data?.mime_type || value.inlineData?.mimeType;
    if (typeof data === "string" && data.length > 100 && (!mimeType || String(mimeType).startsWith("image/"))) {
      return { data, mimeType: mimeType || "image/jpeg" };
    }
    for (const child of Object.values(value)) {
      const found = visit(child);
      if (found) return found;
    }
    return null;
  };
  return visit(payload);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const projectTitle = typeof body?.projectTitle === "string" ? body.projectTitle.trim() : "";
    const logline = typeof body?.logline === "string" ? body.logline.trim() : "";
    const visualStyle = typeof body?.visualStyle === "string" ? body.visualStyle.trim() : "";
    const scenes = Array.isArray(body?.scenes) ? body.scenes.slice(0, 16) : [];
    if (!prompt && !logline && scenes.length === 0) {
      return NextResponse.json({ error: "Prompt cerita belum tersedia. Buat storyboard terlebih dahulu." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY belum diatur di Environment Variables Vercel." }, { status: 500 });

    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
    const base = (process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
    const sceneSummary = scenes.map((scene: any, index: number) => {
      const title = typeof scene?.title === "string" ? scene.title : `Adegan ${index + 1}`;
      const action = typeof scene?.action === "string" ? scene.action : "";
      const continuity = typeof scene?.continuity === "string" ? scene.continuity : "";
      const imagePrompt = typeof scene?.image_prompt === "string" ? scene.image_prompt : "";
      return `${index + 1}. ${title}: ${action} ${continuity} ${imagePrompt}`.slice(0, 700);
    }).join("\n");

    const imagePrompt = `Create a professional PHOTOREALISTIC CHARACTER SHEET for the recurring and important characters automatically identified from this story. Do not make a sheet for only one protagonist if the story clearly contains multiple named or recurring characters. Story prompt: ${prompt}. Project: ${projectTitle}. Logline: ${logline}. Visual context: ${visualStyle}. Scene references: ${sceneSummary}.\n\nFirst infer the main recurring characters from the story prompt and scene references, prioritizing characters who speak, act, or are mentioned repeatedly. Create a clean, readable landscape 16:9 studio reference board with a separate clearly spaced section for each identified character, ideally up to 4 characters so each remains recognizable. For EACH character, show the same person consistently in full-body front view, side view, back view, and a close-up face portrait with a distinct neutral expression. Give each character a visually distinct, story-appropriate outfit and silhouette. Keep that character's face, apparent age, skin tone, hairstyle, body proportions, outfit, accessories, and colors identical across their views. Infer missing appearance details creatively but coherently from the story. Photorealistic Indonesian / Southeast Asian appearance when appropriate to the story, realistic anatomy and skin texture, detailed fabric, professional film production reference, soft neutral studio lighting, plain light-grey background, clear spacing, all figures fully visible. Do not merge characters together, do not duplicate a character as if they were different people, no extra limbs, no overlapping panels, no logos, no watermark. Avoid long text and tiny labels; visual consistency is the priority.`;

    const response = await fetch(`${base}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        input: imagePrompt,
        response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: "16:9", image_size: "1K" },
      }),
      cache: "no-store",
    });

    const payload = await response.json();
    if (!response.ok) {
      const detail = payload?.error?.message || payload?.message || `Gemini API mengembalikan status ${response.status}.`;
      return NextResponse.json({ error: `Gagal membuat character sheet: ${detail}` }, { status: response.status });
    }

    const image = findImageData(payload);
    if (!image) {
      return NextResponse.json({ error: "API merespons tetapi data gambar tidak ditemukan. Periksa akses model gambar pada akun Gemini API." }, { status: 502 });
    }
    return NextResponse.json({ imageData: image.data, mimeType: image.mimeType });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Terjadi kesalahan server saat membuat character sheet." }, { status: 500 });
  }
}
