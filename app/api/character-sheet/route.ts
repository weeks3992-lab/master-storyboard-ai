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

    const imagePrompt = `Create a professional PHOTOREALISTIC CHARACTER DESIGN / MODEL SHEET for the main protagonist inferred from this story. Story prompt: ${prompt}. Project: ${projectTitle}. Logline: ${logline}. Visual context: ${visualStyle}. Scene references: ${sceneSummary}.\n\nShow the SAME character consistently in a clean studio reference layout: full-body front view, full-body side view, full-body back view, and one large realistic face close-up with a neutral expression. Keep identical face, age range, skin tone, hairstyle, body proportions, outfit, accessories, and colors across every view. Realistic human anatomy, natural skin texture, detailed fabric, cinematic photorealism, professional film production character reference, soft neutral studio lighting, plain light grey background, full figure visible, well-separated views, landscape 16:9 composition. Infer wardrobe and appearance from the story; if details are not specified, make tasteful coherent creative choices. No extra characters, no duplicated limbs, no panels overlapping, no text, no labels, no logos, no watermark.`;

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

