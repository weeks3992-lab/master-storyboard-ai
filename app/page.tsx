
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
    return text.trim()
      ? [{ title: "Storyboard Lengkap", content: text }]
      : [];
  }

  return parts.map((part, index) => ({
    title:
      part.split("\n")[0].trim().replace(/^#{1,4}\s*/, "") ||
      `Adegan ${index + 1}`,
    content: part,
  }));
}

function makeCharacterPrompt(
  idea: string,
  storyboard: string,
  genre: string
) {
  const storySource =
    storyboard.trim() ||
    idea.trim() ||
    "Cerita belum diisi. Buat desain karakter yang sesuai dengan cerita pengguna.";

  return `Buat CHARACTER SHEET profesional untuk karakter-karakter utama dan karakter pendukung yang berulang dalam cerita berikut.

CERITA DAN REFERENSI ADEGAN:
${storySource}

ARAH VISUAL: ${genre}, fotorealistis sinematik, detail wajah dan tekstur pakaian realistis.

INSTRUKSI CHARACTER SHEET:
1. Identifikasi karakter penting yang disebutkan dalam cerita. Pertahankan nama yang sudah tersedia dan jangan mengarang nama baru tanpa kebutuhan.
2. Buat bagian terpisah untuk setiap karakter dengan nama atau label yang jelas.
3. Sertakan tampak seluruh tubuh dari depan, tiga perempat, samping, belakang, serta close-up wajah.
4. Pertahankan identitas wajah, perkiraan usia sesuai cerita, warna kulit, bentuk tubuh, gaya rambut, kostum, alas kaki, dan aksesori secara konsisten.
5. Gunakan latar studio abu-abu netral, pencahayaan lembut merata, pose berdiri natural, anatomi realistis, dan tata letak horizontal 16:9.
6. Ikuti deskripsi kostum dalam cerita. Jika detail penampilan tidak disebutkan, pilih desain yang masuk akal dan konsisten.
7. Fokus pada lembar referensi karakter, bukan adegan aksi atau lokasi cerita.
8. Hindari karakter duplikat, perubahan wajah antar-sudut, anatomi terdistorsi, teks dekoratif, logo, dan watermark.`;
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("Cinematic");
  const [sceneCount, setSceneCount] = useState("3");
  const [storyboard, setStoryboard] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [characterPrompt, setCharacterPrompt] = useState("");
  const [characterError, setCharacterError] = useState("");

  const scenes = splitStoryboard(storyboard);

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#0b0b10",
      color: "#f4f1fa",
      fontFamily: "Arial, sans-serif",
      padding: "28px 20px 64px",
    } as const,
    container: {
      maxWidth: "1000px",
      margin: "0 auto",
    } as const,
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
    secondaryButton: {
      padding: "12px 16px",
      border: "1px solid #51436e",
      borderRadius: "10px",
      background: "transparent",
      color: "#c4b5fd",
      cursor: "pointer",
      fontWeight: 700,
    } as const,
  };

  function prepareCharacterPrompt() {
    if (!idea.trim() && !storyboard.trim()) {
      setCharacterError("Isi ide cerita terlebih dahulu.");
      return;
    }

    setCharacterPrompt(makeCharacterPrompt(idea, storyboard, genre));
    setCharacterError("");
    setCopyMessage("Prompt Character Sheet berhasil dibuat!");
  }

  function refreshCharacterPrompt() {
    if (!idea.trim() && !storyboard.trim()) {
      setCharacterError("Isi ide cerita terlebih dahulu.");
      return;
    }

    setCharacterPrompt(makeCharacterPrompt(idea, storyboard, genre));
    setCharacterError("");
    setCopyMessage("Prompt berhasil diperbarui dari cerita!");
  }

  async function copyCharacterPrompt() {
    if (!characterPrompt.trim()) {
      setCharacterError("Buat prompt terlebih dahulu.");
      return;
    }

    try {
      await navigator.clipboard.writeText(characterPrompt);
      setCharacterError("");
      setCopyMessage("Prompt Character Sheet berhasil disalin!");
    } catch {
      setCharacterError(
        "Gagal menyalin prompt. Silakan salin teks secara manual."
      );
    }
  }

  async function copyStoryboard() {
    try {
      await navigator.clipboard.writeText(storyboard);
      setCopyMessage("Storyboard berhasil disalin!");
    } catch {
      setCopyMessage(
        "Gagal menyalin. Silakan pilih dan salin teks secara manual."
      );
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
    setCharacterPrompt("");
    setCharacterError("");
    setCopyMessage("");

    const cinematicDirection =
      genre === "Cinematic"
        ? "Gunakan gaya visual film sinematik: komposisi profesional, pencahayaan dramatis, gerakan kamera ekspresif, kedalaman atmosfer, tekstur realistis, dan color grading konsisten."
        : `Terapkan gaya visual dan ciri penceritaan genre ${genre}.`;

    const prompt = [
      `Buat storyboard film bergenre ${genre} berdasarkan ide berikut: ${idea.trim()}`,
      `Buat tepat ${sceneCount} adegan dan beri nomor secara berurutan.`,
      "WAJIB tulis seluruh storyboard dalam Bahasa Indonesia.",
      "Untuk setiap adegan, sertakan judul, deskripsi visual, aksi karakter, sudut dan gerakan kamera, pencahayaan dan suasana, serta prompt gambar terperinci.",
      cinematicDirection,
      "Gunakan format konsisten. Mulai setiap bagian dengan 'ADEGAN 1 — Judul', lalu lanjutkan ADEGAN 2, dan seterusnya.",
      "Jaga konsistensi karakter, kostum, lokasi, dan urutan waktu di seluruh adegan.",
      "Prompt gambar harus menggambarkan isi adegan secara spesifik. Penjelasan storyboard harus berbahasa Indonesia.",
    ].join("\n");

    try {
      const response = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const raw = await response.text();
      let data: { storyboard?: string; error?: string };

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          response.ok
            ? "Server mengembalikan respons yang bukan JSON."
            : `Server error (HTTP ${response.status}): ${raw.slice(0, 200)}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Request gagal (HTTP ${response.status}).`
        );
      }

      if (typeof data.storyboard !== "string") {
        throw new Error("Respons API tidak berisi storyboard yang valid.");
      }

      setStoryboard(data.storyboard);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal membuat storyboard. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

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
            <div
              style={{
                color: "#b6a0ff",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "3px",
              }}
            >
              FRAMEFORGE AI
            </div>
            <div
              style={{
                color: "#a6a1b5",
                fontSize: "13px",
                marginTop: "6px",
              }}
            >
              RUANG KERJA SINEMATIK ANDA
            </div>
          </div>
          <span
            style={{
              border: "1px solid #403458",
              color: "#c4b5fd",
              borderRadius: "30px",
              padding: "8px 12px",
              fontSize: "12px",
            }}
          >
            STUDIO STORYBOARD
          </span>
        </header>

        <section style={{ padding: "42px 0 12px" }}>
          <p
            style={{
              color: "#b6a0ff",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "2px",
            }}
          >
            DARI IDE MENJADI LAYAR
          </p>
          <h1
            style={{
              fontSize: "clamp(36px, 7vw, 64px)",
              lineHeight: 1.08,
              letterSpacing: "-2px",
              margin: "14px 0",
            }}
          >
            Ubah ceritamu menjadi{" "}
            <span style={{ color: "#b6a0ff" }}>storyboard.</span>
          </h1>
          <p
            style={{
              color: "#aaa5ba",
              fontSize: "16px",
              lineHeight: 1.8,
              maxWidth: "650px",
            }}
          >
            Kembangkan ide menjadi adegan sinematik dengan deskripsi visual,
            arahan kamera, suasana, dan prompt gambar.
          </p>
        </section>

        <form onSubmit={generateStoryboard} style={styles.panel}>
          <h2 style={{ marginTop: 0, fontSize: "21px" }}>
            Buat storyboard baru
          </h2>
          <p
            style={{
              color: "#a6a1b5",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Mulai dari ide sederhana dan biarkan AI membantu mengembangkan
            adegan.
          </p>

          <div style={{ marginTop: "24px" }}>
            <label htmlFor="idea" style={styles.label}>
              IDE CERITAMU
            </label>
            <textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Tuliskan ide cerita dan karakter utama..."
              required
              rows={5}
              maxLength={5000}
              style={{
                ...styles.field,
                resize: "vertical",
                lineHeight: 1.7,
              }}
            />
            <div
              style={{
                color: "#777286",
                fontSize: "12px",
                textAlign: "right",
                marginTop: "6px",
              }}
            >
              {idea.length}/5000 karakter
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "18px",
              marginTop: "20px",
            }}
          >
            <div>
              <label htmlFor="genre" style={styles.label}>
                GENRE / GAYA VISUAL
              </label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                style={styles.field}
              >
                {[
                  "Sci-Fi",
                  "Fantasy",
                  "Cinematic",
                  "Action",
                  "Adventure",
                  "Horror",
                  "Drama",
                  "Comedy",
                  "Thriller",
                  "Animation",
                ].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sceneCount" style={styles.label}>
                JUMLAH ADEGAN
              </label>
              <select
                id="sceneCount"
                value={sceneCount}
                onChange={(e) => setSceneCount(e.target.value)}
                style={styles.field}
              >
                {["3", "6", "9", "12"].map((n) => (
                  <option key={n} value={n}>
                    {n} adegan
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginTop: "20px",
                padding: "14px",
                background: "#321c28",
                color: "#ffb4c0",
                borderRadius: "10px",
                lineHeight: 1.6,
                overflowWrap: "anywhere",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "24px",
              width: "100%",
              padding: "16px",
              border: "none",
              borderRadius: "11px",
              background: loading ? "#65538e" : "#a78bfa",
              color: "#171020",
              fontSize: "15px",
              fontWeight: 800,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Sedang membuat storyboard..." : "✦ Buat Storyboard"}
          </button>
          <p
            style={{
              color: "#817b91",
              fontSize: "12px",
              textAlign: "center",
              marginBottom: 0,
              lineHeight: 1.6,
            }}
          >
            Hasil AI mungkin perlu ditinjau dan disunting kembali.
          </p>
        </form>

        {loading && (
          <div
            role="status"
            style={{
              ...styles.panel,
              textAlign: "center",
              color: "#c4b5fd",
              lineHeight: 1.8,
            }}
          >
            Sedang mengembangkan adeganmu...
            <p style={{ color: "#a6a1b5", fontSize: "14px" }}>
              AI sedang mengolah ceritamu. Proses ini mungkin membutuhkan
              waktu.
            </p>
          </div>
        )}

        {(storyboard || idea.trim()) && !loading && (
          <section style={styles.panel}>
            <div
              style={{
                color: "#b6a0ff",
                fontSize: "12px",
                letterSpacing: "2px",
                fontWeight: 800,
              }}
            >
              CHARACTER STUDIO
            </div>

            <h2 style={{ fontSize: "25px", marginBottom: "8px" }}>
              Buat Prompt Character Sheet
            </h2>
            <p
              style={{
                color: "#a6a1b5",
                fontSize: "14px",
                lineHeight: 1.7,
              }}
            >
              Buat, edit, dan salin prompt referensi karakter berdasarkan
              ceritamu. Fitur ini hanya menghasilkan teks, bukan gambar, dan
              tidak memanggil API gambar.
            </p>

            <button
              type="button"
              onClick={prepareCharacterPrompt}
              style={styles.secondaryButton}
            >
              ✦ Buat Prompt Karakter
            </button>

            <div style={{ marginTop: "18px" }}>
              <label htmlFor="characterPrompt" style={styles.label}>
                PROMPT CHARACTER SHEET
              </label>
              <textarea
                id="characterPrompt"
                value={characterPrompt}
                onChange={(e) => setCharacterPrompt(e.target.value)}
                placeholder="Klik tombol di atas untuk menyusun prompt..."
                rows={12}
                style={{
                  ...styles.field,
                  resize: "vertical",
                  lineHeight: 1.7,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "16px",
              }}
            >
              <button
                type="button"
                onClick={refreshCharacterPrompt}
                style={styles.secondaryButton}
              >
                Perbarui dari Cerita
              </button>
              <button
                type="button"
                onClick={copyCharacterPrompt}
                disabled={!characterPrompt.trim()}
                style={{
                  ...styles.secondaryButton,
                  opacity: characterPrompt.trim() ? 1 : 0.5,
                  cursor: characterPrompt.trim() ? "pointer" : "not-allowed",
                }}
              >
                Salin Prompt
              </button>
            </div>

            {characterError && (
              <div
                role="alert"
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  background: "#321c28",
                  color: "#ffb4c0",
                  borderRadius: "10px",
                  lineHeight: 1.6,
                  overflowWrap: "anywhere",
                }}
              >
                {characterError}
              </div>
            )}

            {copyMessage && (
              <p
                role="status"
                style={{ color: "#c4b5fd", fontSize: "13px" }}
              >
                {copyMessage}
              </p>
            )}
          </section>
        )}

        {storyboard && !loading && (
          <section style={styles.panel}>
            <h2 style={{ marginTop: 0, fontSize: "25px" }}>
              Hasil Storyboard
            </h2>
            <button
              type="button"
              onClick={copyStoryboard}
              style={styles.secondaryButton}
            >
              Salin Storyboard
            </button>

            <div style={{ marginTop: "20px" }}>
              {scenes.map((scene, index) => (
                <article
                  key={`${index}-${scene.title}`}
                  style={{
                    padding: "18px 0",
                    borderTop: "1px solid #2b2938",
                  }}
                >
                  <h3 style={{ color: "#c4b5fd", fontSize: "18px" }}>
                    {scene.title}
                  </h3>
                  <p
                    style={{
                      color: "#d8d3e5",
                      fontSize: "14px",
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {scene.content}
                  </p>
                </article>
              ))}
            </div>

            <label htmlFor="storyboardText" style={styles.label}>
              EDIT STORYBOARD
            </label>
            <textarea
              id="storyboardText"
              value={storyboard}
              onChange={(e) => setStoryboard(e.target.value)}
              rows={14}
              style={{
                ...styles.field,
                resize: "vertical",
                lineHeight: 1.7,
                marginTop: "8px",
              }}
            />
            {copyMessage && (
              <p
                role="status"
                style={{ color: "#c4b5fd", fontSize: "13px" }}
              >
                {copyMessage}
              </p>
            )}
          </section>
        )}

        <footer
          style={{
            marginTop: "36px",
            paddingTop: "20px",
            borderTop: "1px solid #292735",
            color: "#777286",
            fontSize: "12px",
            lineHeight: 1.8,
            textAlign: "center",
          }}
        >
          FRAMEFORGE AI · Wujudkan ide sinematikmu
        </footer>
      </div>
    </main>
  );
}
