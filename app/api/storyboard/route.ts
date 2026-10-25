import { NextResponse } from "next/server";

export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const { prompt, style, sceneCount, duration, language } = await req.json();
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt cerita wajib diisi." }, { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key belum dikonfigurasi. Salin .env.example menjadi .env.local lalu isi GEMINI_API_KEY." }, { status: 500 });

    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const base = (process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
    const n = Math.max(4, Math.min(16, Number(sceneCount) || 8));
    const instruction = `Anda adalah sutradara, storyboard artist, sinematografer, dan script supervisor profesional.
Buat MASTER STORYBOARD yang setia pada prompt, masuk akal secara visual, punya kesinambungan karakter/lokasi/objek, dan alur sebab-akibat yang jelas.
Bahasa output: ${language || "Bahasa Indonesia"}. Gaya visual: ${style || "Sinematik realistis"}. Target durasi: ${duration || "60–90 detik"}. Jumlah scene: tepat ${n}.
Semua frame wajib 16:9. Jangan mengarang karakter utama baru yang bertentangan dengan prompt. Variasikan shot size dan angle sesuai kebutuhan cerita. Setiap scene harus punya satu aksi utama yang mudah divisualisasikan. PENTING: field dialogue WAJIB berisi dialog lisan yang nyata pada SETIAP scene, jangan pernah kosong, jangan isi dengan tanda strip, dan jangan menulis “tanpa dialog”. Buat 1–2 kalimat singkat yang terasa alami, sesuai kejadian scene, tujuan karakter, dan emosi saat itu. Tulis nama pembicara sebelum dialog, misalnya “MAYA (berbisik): Kita harus pergi sekarang.” Jika tidak ada karakter yang terlihat berbicara, gunakan dialog voice-over/narator atau suara dari karakter di luar layar yang relevan dengan cerita. Jangan mengulang kalimat yang sama antar-scene; jaga konsistensi nama dan karakter. Gunakan bahasa yang dipilih pada Bahasa output untuk dialog juga. Hindari teks/logo/watermark di gambar. image_prompt harus berupa prompt gambar yang rinci dan mandiri, menyebut karakter, pakaian, lingkungan, aksi, framing 16:9, lensa/lighting, gaya visual, dan kontinuitas yang relevan. Jangan minta teks tertulis muncul di gambar.
Kembalikan JSON valid saja, tanpa markdown, dengan struktur:
{
 "project_title":"string",
 "logline":"string",
 "visual_style":"string",
 "aspect_ratio":"16:9",
 "estimated_duration":"string",
 "scenes":[
  {"scene":1,"title":"string","duration":"contoh 00:00-00:06","location":"string","time_of_day":"string","shot_type":"string","camera_movement":"string","composition":"string","action":"string","dialogue":"string","lighting_color":"string","sound":"string","continuity":"string","image_prompt":"string"}
 ]
}
Nomor scene berurutan dari 1. Durasi scene harus kira-kira cocok dengan target durasi. Semua properti wajib ada. Pastikan dialogue untuk setiap scene berisi dialog lisan dengan nama pembicara dan ucapan, bukan deskripsi aksi atau suara latar.`;
    const response = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instruction }] },
        contents: [{ role: "user", parts: [{ text: `PROMPT CERITA:\n${prompt.trim()}` }] }],
        generationConfig: { temperature: 0.65, responseMimeType: "application/json" }
      }),
      cache: "no-store"
    });
    const payload = await response.json();
    if (!response.ok) {
      const detail = payload?.error?.message || `Gemini API mengembalikan status ${response.status}.`;
      return NextResponse.json({ error: `Gemini API: ${detail}` }, { status: response.status });
    }
    const text = payload?.candidates?.[0]?.content?.parts?.map((p: {text?:string}) => p.text || "").join("");
    if (!text) return NextResponse.json({ error: "Model tidak mengembalikan storyboard. Coba prompt lain atau periksa model API." }, { status: 502 });
    let board;
    try { board = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim()); }
    catch { return NextResponse.json({ error: "Respons model bukan JSON valid. Coba generate kembali." }, { status: 502 }); }
    if (!Array.isArray(board.scenes) || !board.scenes.length) return NextResponse.json({ error: "Storyboard tidak berisi scene yang valid." }, { status: 502 });
    board.scenes = board.scenes.slice(0, n).map((s: Record<string, unknown>, i: number) => {
      const dialogue = typeof s.dialogue === "string" ? s.dialogue.trim() : "";
      return {
        ...s,
        scene: i + 1,
        // Jangan biarkan field dialog kosong jika model mengabaikan instruksi.
        dialogue: dialogue || (String(language || "Bahasa Indonesia").toLowerCase().startsWith("english")
          ? `NARRATOR (voice-over): ${String(s.action || s.title || "The story continues.").trim()}`
          : `NARATOR (voice-over): ${String(s.action || s.title || "Cerita berlanjut.").trim()}`)
      };
    });
    // Kompatibilitas: versi frontend lama membaca data.storyboard (string),
    // sedangkan frontend baru membaca data.scenes (array). Kembalikan keduanya.
    const sceneText = (board.scenes as Array<Record<string, unknown>>).map((s, i) => [
      `## Adegan ${String(i + 1).padStart(2, "0")} — ${String(s.title || "Tanpa judul")}`,
      `**Durasi:** ${String(s.duration || "—")}`,
      `**Lokasi:** ${String(s.location || "—")} | **Waktu:** ${String(s.time_of_day || "—")}`,
      `**Shot & kamera:** ${String(s.shot_type || "—")} | ${String(s.camera_movement || "—")}`,
      `**Komposisi:** ${String(s.composition || "—")}`,
      `**Aksi:** ${String(s.action || "—")}`,
      `**Dialog:** ${String(s.dialogue || "—")}`,
      `**Pencahayaan & warna:** ${String(s.lighting_color || "—")}`,
      `**Suara:** ${String(s.sound || "—")}`,
      `**Kontinuitas:** ${String(s.continuity || "—")}`,
      `**Prompt gambar:** ${String(s.image_prompt || "—")}`,
    ].join("\n")).join("\n\n");

    const storyboardText = [
      `# ${board.project_title || "Master Storyboard"}`,
      board.logline ? `\n**Logline:** ${board.logline}` : "",
      board.visual_style ? `**Gaya visual:** ${board.visual_style}` : "",
      `**Durasi:** ${board.estimated_duration || duration || "Belum ditentukan"}`,
      "",
      sceneText
    ].filter(Boolean).join("\n");

    return NextResponse.json({ ...board, storyboard: storyboardText });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Terjadi kesalahan server." }, { status: 500 });
  }
}
