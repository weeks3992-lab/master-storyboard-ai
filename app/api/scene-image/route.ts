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
    const style = typeof body?.style === "string" ? body.style.trim() : "Sinematik realistis";
    if (!prompt) return NextResponse.json({ error: "Prompt gambar adegan tidak ditemukan." }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY belum diatur di Environment Variables Vercel." }, { status: 500 });

    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
    const base = (process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
    const imagePrompt = `Generate one polished cinematic storyboard frame. Visual style: ${style}. Scene prompt: ${prompt}. Wide 16:9 composition, coherent lighting, professional film still, clear subject, no lettering, no captions, no logos, no watermark.`;

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
      return NextResponse.json({ error: `Gagal membuat gambar: ${detail}` }, { status: response.status });
    }

    const image = findImageData(payload);
    if (!image) {
      return NextResponse.json({ error: "API merespons tetapi data gambar tidak ditemukan. Periksa akses model gambar pada akun Gemini API." }, { status: 502 });
    }
    return NextResponse.json({ imageData: image.data, mimeType: image.mimeType });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Terjadi kesalahan server saat membuat gambar." }, { status: 500 });
  }
}
