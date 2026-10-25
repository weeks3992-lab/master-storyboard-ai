
"use client";

import { useState, type FormEvent } from "react";

type Scene = {
  title: string;
  content: string;
};

function splitStoryboard(text: string): Scene[] {
  const parts = text
    .split(/(?=^\s*(?:#{1,4}\s*)?ADEGAN\s*\d+\b)/gim)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [];
  }

  return parts.map((part, index) => {
    const firstLine = part.split("\n")[0].trim();

    return {
      title: firstLine.replace(/^#{1,4}\s*/, "") || `Adegan ${index + 1}`,
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

  const scenes = splitStoryboard(storyboard);

  async function generateStoryboard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!idea.trim()) {
      setError("Masukkan ide cerita terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    setStoryboard("");
    setCopyMessage("");

    const prompt = [
      `Buat storyboard film bergenre ${genre} berdasarkan ide berikut: ${idea.trim()}`,
      `Buat tepat ${sceneCount} adegan bernomor.`,
      "Tulis seluruh storyboard dalam Bahasa Indonesia.",
      "Untuk setiap adegan, sertakan judul, deskripsi visual, aksi karakter, sudut kamera, gerakan kamera, pencahayaan, suasana, dan prompt gambar terperinci.",
      "Jaga konsistensi karakter, kostum, lokasi, dan urutan waktu.",
      "Awali setiap adegan dengan format ADEGAN 1 — Judul, lalu lanjutkan nomor berikutnya.",
    ].join("\n");

    try {
      const response = await fetch("/api/storyboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Storyboard gagal dibuat. Silakan coba lagi."
        );
      }

      if (typeof data.storyboard !== "string" || !data.storyboard.trim()) {
        throw new Error("API tidak mengembalikan storyboard.");
      }

      setStoryboard(data.storyboard);
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

  async function copyStoryboard() {
    try {
      await navigator.clipboard.writeText(storyboard);
      setCopyMessage("Storyboard berhasil disalin!");
    } catch {
      setCopyMessage("Gagal menyalin. Silakan salin teks secara manual.");
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
    },
    label: {
      display: "block",
      marginBottom: "9px",
      fontSize: "14px",
      fontWeight: 700,
      color: "#ded9eb",
    },
    button: {
      padding: "14px 18px",
      border: "none",
      borderRadius: "10px",
      background: "#a78bfa",
      color: "#171020",
      fontSize: "15px",
      fontWeight: 700,
      cursor: "pointer",
    },
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header
          style={{
            borderBottom: "1px solid #292735",
            paddingBottom: "20px",
          }}
        >
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
          <p style={{ color: "#a6a1b5", fontSize: "13px" }}>
            RUANG KERJA SINEMATIK ANDA
          </p>
        </header>

        <section style={{ padding: "35px 0 12px" }}>
          <p style={{ color: "#b6a0ff", letterSpacing: "2px" }}>
            DARI IDE MENJADI LAYAR
          </p>
          <h1 style={{ fontSize: "clamp(36px, 7vw, 64px)" }}>
            Ubah ceritamu menjadi{" "}
            <span style={{ color: "#b6a0ff" }}>storyboard.</span>
          </h1>
          <p style={{ color: "#aaa5ba", lineHeight: 1.8 }}>
            Kembangkan ide menjadi adegan sinematik dengan deskripsi visual,
            arahan kamera, suasana, dan prompt gambar.
          </p>
        </section>

        <form onSubmit={generateStoryboard} style={styles.panel}>
          <h2>Buat storyboard baru</h2>

          <div style={{ marginTop: "20px" }}>
            <label htmlFor="idea" style={styles.label}>
              IDE CERITAMU
            </label>
            <textarea
              id="idea"
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
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
                onChange={(event) => setGenre(event.target.value)}
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
                ].map((item) => (
                  <option key={item} value={item}>
                    {item}
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
                onChange={(event) => setSceneCount(event.target.value)}
                style={styles.field}
              >
                {["3", "6", "9", "12"].map((number) => (
                  <option key={number} value={number}>
                    {number} adegan
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              style={{
                marginTop: "20px",
                padding: "14px",
                background: "#321c28",
                color: "#ffb4c0",
                borderRadius: "10px",
                overflowWrap: "anywhere",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              width: "100%",
              marginTop: "24px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Sedang membuat storyboard..." : "✦ Buat Storyboard"}
          </button>
        </form>

        {loading && (
          <section role="status" style={styles.panel}>
            Sedang mengembangkan adeganmu. Mohon tunggu...
          </section>
        )}

        {storyboard && !loading && (
          <section style={styles.panel}>
            <h2>
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
                    padding: "18px",
                    minWidth: 0,
                  }}
                >
                  <p style={{ color: "#b6a0ff", fontSize: "12px" }}>
                    ADEGAN {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3>{scene.title}</h3>
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      color: "#c9c4d6",
                      fontSize: "14px",
                      lineHeight: 1.8,
                    }}
                  >
                    {scene.content}
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={copyStoryboard}
              style={{ ...styles.button, marginTop: "24px" }}
            >
              Salin seluruh storyboard
            </button>

            {copyMessage && <p role="status">{copyMessage}</p>}
          </section>
        )}

        <footer
          style={{
            marginTop: "36px",
            paddingTop: "20px",
            borderTop: "1px solid #292735",
            color: "#777286",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          FRAMEFORGE AI · Wujudkan ide sinematikmu
        </footer>
      </div>
    </main>
  );
}
