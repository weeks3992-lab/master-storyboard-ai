
"use client";

import { useMemo, useState, type FormEvent } from "react";

type StoryboardScene = {
  title: string;
  content: string;
};

type CharacterSheetResponse = {
  imageData?: string;
  mimeType?: string;
  error?: string;
};

function splitStoryboard(text: string): StoryboardScene[] {
  const parts = text
    .split(/(?=^\s*(?:#{1,4}\s*)?(?:Adegan|Scene)\s*\d+\b)/gim)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return text.trim()
      ? [{ title: "Storyboard Lengkap", content: text.trim() }]
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
): string {
  const storySource =
    storyboard.trim() ||
    idea.trim() ||
    "Cerita belum diisi. Simpulkan karakter utama dari cerita pengguna.";

  return `Buat CHARACTER SHEET profesional untuk karakter-karakter utama dan karakter pendukung yang berulang dalam cerita berikut.

CERITA DAN REFERENSI ADEGAN:
${storySource}

ARAH VISUAL: ${genre}, fotorealistis sinematik, detail wajah dan tekstur pakaian realistis.

INSTRUKSI CHARACTER SHEET:
1. Identifikasi nama karakter penting yang disebutkan dalam cerita. Jangan mengarang nama baru jika nama karakter sudah tersedia.
2. Pisahkan setiap karakter pada bagian tersendiri dengan nama atau label yang jelas.
3. Tampilkan tampak seluruh tubuh dari depan, tiga perempat, samping, dan belakang, serta close-up wajah.
4. Pertahankan identitas wajah, perkiraan usia sesuai cerita, warna kulit, bentuk tubuh, gaya rambut, kostum, alas kaki, dan aksesori secara konsisten.
5. Gunakan latar studio abu-abu netral, pencahayaan lembut merata, pose natural, anatomi realistis, dan tata letak horizontal 16:9.
6. Ikuti deskripsi kostum dalam cerita. Jika detail tidak tersedia, buat desain yang masuk akal dan konsisten.
7. Fokus pada referensi karakter, bukan adegan aksi atau latar lokasi cerita.
8. Hindari karakter duplikat, perubahan wajah antar-sudut, anatomi terdistorsi, logo, dan watermark.`;
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
  const [characterImage, setCharacterImage] = useState("");
  const [characterError, setCharacterError] = useState("");
  const [characterLoading, setCharacterLoading] = useState(false);

  const scenes = useMemo(
    () => splitStoryboard(storyboard),
    [storyboard]
  );

  function prepareCharacterPrompt() {
    setCharacterPrompt(makeCharacterPrompt(idea, storyboard, genre));
    setCharacterError("");
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
    setCopyMessage("");
    setCharacterImage("");
    setCharacterError("");

    const cinematicDirection =
      genre === "Cinematic"
        ? "Gunakan gaya visual film sinematik: komposisi profesional, pencahayaan dramatis, gerakan kamera ekspresif, kedalaman atmosfer, tekstur realistis, dan color grading konsisten."
        : `Terapkan gaya visual dan ciri penceritaan genre ${genre}.`;

    const prompt = [
      `Buat storyboard film bergenre ${genre} berdasarkan ide berikut: ${idea.trim()}`,
      `Buat tepat ${sceneCount} adegan dan beri nomor secara berurutan.`,
      "WAJIB tulis seluruh storyboard dalam Bahasa Indonesia.",
      "Untuk setiap adegan, sertakan judul, deskripsi visual, aksi karakter, sudut dan gerakan kamera, pencahayaan, suasana, serta prompt gambar terperinci.",
      cinematicDirection,
      "Mulai setiap bagian dengan format ADEGAN 1 — Judul, lalu ADEGAN 2, dan seterusnya.",
      "Jaga konsistensi karakter, kostum, lokasi, dan urutan waktu.",
      "Prompt gambar harus menggambarkan isi adegan secara spesifik.",
    ].join("\n");

    try {
      const response = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Storyboard gagal dibuat. Silakan coba lagi."
        );
      }

      const result = data.storyboard || "";

      if (!result.trim()) {
        throw new Error("AI tidak memberikan hasil storyboard.");
      }

      setStoryboard(result);
      setCharacterPrompt(makeCharacterPrompt(idea, result, genre));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat membuat storyboard."
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateCharacterSheet() {
    if (!idea.trim() && !storyboard.trim()) {
      setCharacterError(
        "Isi ide cerita atau buat storyboard terlebih dahulu."
      );
      return;
    }

    const promptToSend =
      characterPrompt.trim() ||
      makeCharacterPrompt(idea, storyboard, genre);

    if (!characterPrompt.trim()) {
      setCharacterPrompt(promptToSend);
    }

    setCharacterLoading(true);
    setCharacterError("");
    setCharacterImage("");

    try {
      const response = await fetch("/api/character-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          projectTitle: "FrameForge AI Character Sheet",
          logline: idea,
          visualStyle: genre,
          scenes: storyboard,
        }),
      });

      const raw = await response.text();

      let data: CharacterSheetResponse;

      try {
        data = JSON.parse(raw) as CharacterSheetResponse;
      } catch {
        throw new Error(
          `Respons server tidak valid (HTTP ${response.status}). ${raw.slice(0, 200)}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Gagal membuat Character Sheet (HTTP ${response.status}).`
        );
      }

      if (!data.imageData) {
        throw new Error(
          "API tidak mengembalikan gambar. Periksa endpoint dan model Gemini."
        );
      }

      const imageData = data.imageData.startsWith("data:")
        ? data.imageData
        : `data:${data.mimeType || "image/jpeg"};base64,${data.imageData}`;

      setCharacterImage(imageData);
    } catch (err) {
      setCharacterError(
        err instanceof Error
          ? err.message
          : "Character Sheet gagal dibuat. Silakan coba lagi."
      );
    } finally {
      setCharacterLoading(false);
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#0b0b10",
      color: "#f4f1fa",
      fontFamily: "Arial, sans-serif",
      padding: "28px 20px 64px",
    },
    container: {
      maxWidth: "1000px",
      margin: "0 auto",
    },
    panel: {
      background: "#14141d",
      border: "1px solid #2b2938",
      borderRadius: "18px",
      padding: "24px",
      marginTop: "24px",
    },
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
    },
    label: {
      display: "block",
      marginBottom: "9px",
      fontSize: "14px",
      fontWeight: 700,
      color: "#ded9eb",
    },
    secondaryButton: {
      padding: "12px 16px",
      border: "1px solid #51436e",
      borderRadius: "10px",
      background: "transparent",
      color: "#c4b5fd",
      cursor: "pointer",
      fontWeight: 700,
    },
  };

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
              onChange={(e) => {
                setIdea(e.target.value);
                if (!storyboard) setCharacterPrompt("");
              }}
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
              Deteksi Karakter &amp; Buat Sheet
            </h2>

            <p
              style={{
                color: "#a6a1b5",
                fontSize: "14px",
                lineHeight: 1.7,
              }}
            >
              Siapkan prompt lembar referensi karakter dari ide cerita atau
              storyboard. Kamu bisa mengedit prompt sebelum mengirimnya ke API
              gambar.
            </p>

            <button
              type="button"
              onClick={prepareCharacterPrompt}
              style={styles.secondaryButton}
            >
              ✦ Buat / Perbarui Prompt Karakter
            </button>

            <div style={{ marginTop: "18px" }}>
              <label htmlFor="characterPrompt" style={styles.label}>
                PROMPT CHARACTER SHEET
              </label>

              <textarea
                id="characterPrompt"
                value={characterPrompt}
                onChange={(e) => setCharacterPrompt(e.target.value)}
                placeholder="Klik 'Buat / Perbarui Prompt Karakter' untuk menyusun prompt otomatis..."
                rows={12}
                style={{
                  ...styles.field,
                  resize: "vertical",
                  lineHeight: 1.7,
                }}
              />
            </div>

            <button
              type="button"
              disabled={characterLoading}
              onClick={generateCharacterSheet}
              style={{
                marginTop: "16px",
                width: "100%",
                padding: "16px",
                border: "none",
                borderRadius: "11px",
                background: characterLoading ? "#65538e" : "#a78bfa",
                color: "#171020",
                fontSize: "15px",
                fontWeight: 800,
                cursor: characterLoading ? "wait" : "pointer",
              }}
            >
              {characterLoading
                ? "Sedang membuat Character Sheet..."
                : "✦ Deteksi Karakter & Buat Sheet"}
            </button>

            <p
              style={{
                color: "#817b91",
                fontSize: "12px",
                lineHeight: 1.6,
              }}
            >
              Pembuatan gambar memerlukan endpoint Character Sheet aktif dan
              model Gemini yang mendukung pembuatan gambar.
            </p>

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

            {characterImage && (
              <div style={{ marginTop: "20px" }}>
                <h3>Hasil Character Sheet</h3>

                <img
                  src={characterImage}
                  alt="Character Sheet hasil generasi AI"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    borderRadius: "12px",
                    border: "1px solid #373447",
                  }}
                />

                <a
                  href={characterImage}
                  download="frameforge-character-sheet.jpg"
                  style={{
                    display: "inline-block",
                    marginTop: "12px",
                    color: "#c4b5fd",
                  }}
                >
                  Simpan gambar Character Sheet
                </a>
              </div>
            )}
          </section>
        )}

        {storyboard && !loading && (
          <section style={styles.panel}>
            <div
              style={{
                color: "#b6a0ff",
                fontSize: "12px",
                letterSpacing: "2px",
                fontWeight: 800,
              }}
            >
              STORYBOARD KAMU
            </div>

            <h2 style={{ fontSize: "26px", marginBottom: "20px" }}>
              {genre} · {scenes.length} panel
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "18px",
              }}
            >
              {scenes.map((scene, index) => (
                <article
                  key={`${index}-${scene.title}`}
                  style={{
                    background: "#0d0d14",
                    border: "1px solid #373447",
                    borderRadius: "14px",
                    overflow: "hidden",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "16 / 9",
                      background:
                        "linear-gradient(135deg, #211b35, #392653, #11111a)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      gap: "8px",
                      color: "#c4b5fd",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "30px" }}>🎬</span>
                    <span style={{ fontSize: "12px" }}>
                      VISUAL ADEGAN {String(index + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: "11px", color: "#a6a1b5" }}>
                      Gambar AI akan ditampilkan di sini
                    </span>
                  </div>

                  <div style={{ padding: "18px" }}>
                    <div
                      style={{
                        color: "#b6a0ff",
                        fontSize: "11px",
                        fontWeight: 800,
                        letterSpacing: "1px",
                        marginBottom: "8px",
                      }}
                    >
                      ADEGAN {String(index + 1).padStart(2, "0")}
                    </div>

                    <h3 style={{ fontSize: "17px", margin: "0 0 12px" }}>
                      {scene.title}
                    </h3>

                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        color: "#c9c4d6",
                        fontSize: "13px",
                        lineHeight: 1.8,
                      }}
                    >
                      {scene.content}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={copyStoryboard}
              style={{
                ...styles.secondaryButton,
                marginTop: "24px",
              }}
            >
              Salin seluruh storyboard
            </button>

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
