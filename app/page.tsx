"use client";

import { useState, type FormEvent } from "react";

type StoryboardScene = {
  title: string;
  content: string;
};

function splitStoryboard(text: string): StoryboardScene[] {
  const parts = text
    .split(/(?=^\s*(?:#{1,4}\s*)?(?:Adegan|Scene)\s*\d+\b)/gim)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return [{ title: "Storyboard Lengkap", content: text }];
  }

  return parts.map((part, index) => {
    const firstLine = part.split("\n")[0].trim();
    const title = firstLine.replace(/^#{1,4}\s*/, "");
    return {
      title: title || `Adegan ${index + 1}`,
      content: part,
    };
  });
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("Sci-Fi");
  const [sceneCount, setSceneCount] = useState("6");
  const [storyboard, setStoryboard] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  async function copyStoryboard() {
    try {
      await navigator.clipboard.writeText(storyboard);
      setCopyMessage("Storyboard berhasil disalin!");
    } catch {
      setCopyMessage("Gagal menyalin. Silakan pilih dan salin teks secara manual.");
    }
  }

  async function generateStoryboard(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!idea.trim()) {
      setError("Masukkan ide cerita terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    setStoryboard("");
    setCopyMessage("");

    const cinematicDirection =
      genre === "Cinematic"
        ? "Gunakan gaya visual film sinematik: komposisi gambar profesional, pencahayaan dramatis, gerakan kamera ekspresif, kedalaman atmosfer, tekstur realistis, dan color grading yang konsisten."
        : `Terapkan gaya visual dan ciri penceritaan genre ${genre}.`;

    const prompt = [
      `Buat storyboard film bergenre ${genre} berdasarkan ide berikut: ${idea.trim()}`,
      `Buat tepat ${sceneCount} adegan dan beri nomor secara berurutan.`,
      "WAJIB tulis seluruh storyboard dalam Bahasa Indonesia.",
      "Untuk setiap adegan, sertakan judul, deskripsi visual, aksi karakter, sudut dan gerakan kamera, pencahayaan dan suasana, serta prompt gambar yang terperinci.",
      cinematicDirection,
      "Gunakan format yang konsisten. Mulai setiap bagian dengan 'ADEGAN 1 — Judul', lalu lanjutkan ADEGAN 2, dan seterusnya.",
      "Jaga konsistensi karakter, kostum, lokasi, dan urutan waktu di seluruh adegan.",
      "Prompt gambar harus menggambarkan isi adegan secara spesifik. Boleh gunakan istilah teknis visual berbahasa Inggris jika lebih tepat, tetapi penjelasan storyboard harus berbahasa Indonesia.",
    ].join("\n");

    try {
      const response = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Storyboard gagal dibuat. Silakan coba lagi.");
      }

      setStoryboard(data.storyboard || "AI tidak memberikan hasil. Silakan coba lagi.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#0b0b10",
      color: "#f4f1fa",
      fontFamily: "Arial, sans-serif",
      padding: "28px 20px 64px",
    } as const,
    container: { maxWidth: "1000px", margin: "0 auto" } as const,
    panel: {
      background: "#14141d",
      border: "1px solid #2b2938",
      borderRadius: "18px",
      padding: "24px",
      marginTop: "24px",
    } as const,
    field: {
      width: "100%",
      boxSizing: "border-box" as const,
      padding: "13px 14px",
      borderRadius: "10px",
      border: "1px solid #373447",
      background: "#0d0d14",
      color: "#ffffff",
      fontSize: "15px",
      outlineColor: "#a78bfa",
    } as const,
    label: {
      display: "block",
      marginBottom: "9px",
      fontSize: "14px",
      fontWeight: 700,
      color: "#ded9eb",
    } as const,
  };

  const scenes = storyboard ? splitStoryboard(storyboard) : [];

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            borderBottom: "1px solid #292735",
            paddingBottom: "20px",
          }}
        >
          <div>
            <div style={{ color: "#b6a0ff", fontSize: "13px", fontWeight: 800, letterSpacing: "3px" }}>
              FRAMEFORGE AI
            </div>
            <div style={{ color: "#a6a1b5", fontSize: "13px", marginTop: "6px" }}>
              RUANG KERJA SINEMATIK ANDA
            </div>
          </div>
          <span style={{ border: "1px solid #403458", color: "#c4b5fd", borderRadius: "30px", padding: "8px 12px", fontSize: "12px" }}>
            STUDIO STORYBOARD
          </span>
        </header>

        <section style={{ padding: "42px 0 12px" }}>
          <p style={{ color: "#b6a0ff", fontSize: "13px", fontWeight: 700, letterSpacing: "2px" }}>
            DARI IDE MENJADI LAYAR
          </p>
          <h1 style={{ fontSize: "clamp(36px, 7vw, 64px)", lineHeight: 1.08, letterSpacing: "-2px", margin: "14px 0" }}>
            Ubah ceritamu menjadi <span style={{ color: "#b6a0ff" }}>storyboard.</span>
          </h1>
          <p style={{ color: "#aaa5ba", fontSize: "16px", lineHeight: 1.8, maxWidth: "650px" }}>
            Kembangkan ide menjadi adegan sinematik dengan deskripsi visual, arahan kamera, suasana, dan prompt gambar.
          </p>
        </section>

        <form onSubmit={generateStoryboard} style={styles.panel}>
          <h2 style={{ marginTop: 0, fontSize: "21px" }}>Buat storyboard baru</h2>
          <p style={{ color: "#a6a1b5", fontSize: "14px", lineHeight: 1.6 }}>
            Mulai dari ide sederhana dan biarkan AI membantu mengembangkan adegan.
          </p>

          <div style={{ marginTop: "24px" }}>
            <label htmlFor="idea" style={styles.label}>IDE CERITAMU</label>
            <textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Seorang astronot muda menemukan taman misterius di bawah permukaan Mars..."
              required
              rows={5}
              maxLength={5000}
              style={{ ...styles.field, resize: "vertical", lineHeight: 1.7 }}
            />
            <div style={{ color: "#777286", fontSize: "12px", textAlign: "right", marginTop: "6px" }}>
              {idea.length}/5000 karakter
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "18px", marginTop: "20px" }}>
            <div>
              <label htmlFor="genre" style={styles.label}>GENRE / GAYA VISUAL</label>
              <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} style={styles.field}>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Fantasy">Fantasy</option>
                <option value="Cinematic">Cinematic</option>
                <option value="Action">Action</option>
                <option value="Adventure">Adventure</option>
                <option value="Horror">Horror</option>
                <option value="Drama">Drama</option>
                <option value="Comedy">Comedy</option>
                <option value="Thriller">Thriller</option>
                <option value="Animation">Animation</option>
              </select>
            </div>
            <div>
              <label htmlFor="sceneCount" style={styles.label}>JUMLAH ADEGAN</label>
              <select id="sceneCount" value={sceneCount} onChange={(e) => setSceneCount(e.target.value)} style={styles.field}>
                <option value="3">3 adegan</option>
                <option value="6">6 adegan</option>
                <option value="9">9 adegan</option>
                <option value="12">12 adegan</option>
              </select>
            </div>
          </div>

          {error && (
            <div role="alert" style={{ marginTop: "20px", padding: "14px", background: "#321c28", color: "#ffb4c0", borderRadius: "10px", lineHeight: 1.6 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: "24px", width: "100%", padding: "16px", border: "none", borderRadius: "11px", background: loading ? "#65538e" : "#a78bfa", color: "#171020", fontSize: "15px", fontWeight: 800, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "Sedang membuat storyboard..." : "✦ Buat Storyboard"}
          </button>
          <p style={{ color: "#817b91", fontSize: "12px", textAlign: "center", marginBottom: 0, lineHeight: 1.6 }}>
            Hasil AI mungkin perlu ditinjau dan disunting kembali.
          </p>
        </form>

        {loading && (
          <div role="status" style={{ ...styles.panel, textAlign: "center", color: "#c4b5fd", lineHeight: 1.8 }}>
            Sedang mengembangkan adeganmu...
            <p style={{ color: "#a6a1b5", fontSize: "14px" }}>AI sedang mengolah ceritamu. Proses ini mungkin membutuhkan waktu.</p>
          </div>
        )}

        {storyboard && !loading && (
          <section style={styles.panel}>
            <div style={{ color: "#b6a0ff", fontSize: "12px", letterSpacing: "2px", fontWeight: 800 }}>
              STORYBOARD KAMU
            </div>
            <h2 style={{ fontSize: "26px", marginBottom: "20px" }}>
              {genre} · {scenes.length} panel
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
              {scenes.map((scene, index) => (
                <article key={`${index}-${scene.title}`} style={{ background: "#0d0d14", border: "1px solid #373447", borderRadius: "14px", overflow: "hidden", minWidth: 0 }}>
                  <div style={{ aspectRatio: "16 / 9", background: "linear-gradient(135deg, #211b35, #392653, #11111a)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px", color: "#c4b5fd", padding: "16px", textAlign: "center" }}>
                    <span style={{ fontSize: "30px" }}>🎬</span>
                    <span style={{ fontSize: "12px" }}>VISUAL ADEGAN {String(index + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: "11px", color: "#a6a1b5" }}>Gambar AI akan ditampilkan di sini</span>
                  </div>
                  <div style={{ padding: "18px" }}>
                    <div style={{ color: "#b6a0ff", fontSize: "11px", fontWeight: 800, letterSpacing: "1px", marginBottom: "8px" }}>
                      ADEGAN {String(index + 1).padStart(2, "0")}
                    </div>
                    <h3 style={{ fontSize: "17px", margin: "0 0 12px" }}>{scene.title}</h3>
                    <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#c9c4d6", fontSize: "13px", lineHeight: 1.8 }}>
                      {scene.content}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button type="button" onClick={copyStoryboard} style={{ marginTop: "24px", padding: "12px 16px", border: "1px solid #51436e", borderRadius: "10px", background: "transparent", color: "#c4b5fd", cursor: "pointer" }}>
              Salin seluruh storyboard
            </button>
            {copyMessage && (
              <p role="status" style={{ color: "#c4b5fd", fontSize: "13px" }}>{copyMessage}</p>
            )}
          </section>
        )}

        <footer style={{ marginTop: "36px", paddingTop: "20px", borderTop: "1px solid #292735", color: "#777286", fontSize: "12px", lineHeight: 1.8, textAlign: "center" }}>
          FRAMEFORGE AI · Wujudkan ide sinematikmu
        </footer>
      </div>
    </main>
  );
}
