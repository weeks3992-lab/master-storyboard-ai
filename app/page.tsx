
"use client";

import { useState, type FormEvent } from "react";

type StoryboardScene = {
  title: string;
  content: string;
};

function splitStoryboard(text: string): StoryboardScene[] {
  const parts = text
    .split(/(?=^\s*(?:#{1,4}\s*)?(?:Adegan|Scene)\s*\d+\b)/im)
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
      setCopyMessage(
        "Gagal menyalin. Silakan salin teks secara manual."
      );
    }
  }

  async function generateStoryboard(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!idea.trim()) {
      setError("Please enter your story idea first.");
      return;
    }

    setLoading(true);
    setError("");
    setStoryboard("");

    
const prompt = [
  `Create a ${genre} film storyboard based on this idea: ${idea.trim()}`,
  `Create exactly ${sceneCount} numbered scenes.`,
  "Write the storyboard descriptions in Indonesian.",
  "For every scene include a title, visual action, camera angle and movement, lighting, mood, and a detailed image generation prompt.",
  genre === "Cinematic"
    ? "Use cinematic visual storytelling, dramatic lighting, film-quality composition, expressive camera movement, atmospheric depth, realistic textures, and professional color grading."
    : `Apply the visual style and storytelling conventions of the ${genre} genre.`,
  "Keep the scenes in chronological order.",
  "Use clear headings and separate each scene.",
].join("\n");


    try {
      const response = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not generate storyboard.");
      }

      setStoryboard(data.storyboard || "No storyboard was returned.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
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
            <div style={{ color: "#a6a1b5", fontSize: "13px", marginTop: "6px" }}>
              YOUR CINEMATIC WORKSPACE
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
            STORYBOARD STUDIO
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
            FROM IDEA TO SCREEN
          </p>
          <h1
            style={{
              fontSize: "clamp(36px, 7vw, 64px)",
              lineHeight: 1.08,
              letterSpacing: "-2px",
              margin: "14px 0",
            }}
          >
            Turn your story into a{" "}
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
            Shape your idea into cinematic scenes with visual descriptions,
            camera direction, atmosphere, and image prompts.
          </p>
        </section>

        <form onSubmit={generateStoryboard} style={styles.panel}>
          <h2 style={{ marginTop: 0, fontSize: "21px" }}>
            Create a new storyboard
          </h2>
          <p style={{ color: "#a6a1b5", fontSize: "14px", lineHeight: 1.6 }}>
            Start with a simple idea. Let AI help you develop the scenes.
          </p>

          <div style={{ marginTop: "24px" }}>
            <label htmlFor="idea" style={styles.label}>
              YOUR STORY IDEA
            </label>
            <textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="A young astronaut discovers a mysterious garden beneath the surface of Mars..."
              required
              rows={5}
              maxLength={5000}
              style={{ ...styles.field, resize: "vertical", lineHeight: 1.7 }}
            />
            <div
              style={{
                color: "#777286",
                fontSize: "12px",
                textAlign: "right",
                marginTop: "6px",
              }}
            >
              {idea.length}/5000
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
                GENRE
              </label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                style={styles.field}
              >
                <option>Sci-Fi</option>
                <option>Fantasy</option>
                <option>Cinematic</option>
                <option>Action</option>
                <option>Adventure</option>
                <option>Horror</option>
                <option>Drama</option>
                <option>Comedy</option>
                <option>Thriller</option>
                <option>Animation</option>
              </select>
            </div>

            <div>
              <label htmlFor="sceneCount" style={styles.label}>
                NUMBER OF SCENES
              </label>
              <select
                id="sceneCount"
                value={sceneCount}
                onChange={(e) => setSceneCount(e.target.value)}
                style={styles.field}
              >
                <option value="3">3 scenes</option>
                <option value="6">6 scenes</option>
                <option value="9">9 scenes</option>
                <option value="12">12 scenes</option>
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
            {loading ? "Creating your storyboard..." : "✦ Generate Storyboard"}
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
            AI-generated results may need review and editing.
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
            Developing your scenes...
            <p style={{ color: "#a6a1b5", fontSize: "14px" }}>
              The AI is working on your story. This may take a little while.
            </p>
          </div>
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
      {genre} · {splitStoryboard(storyboard).length} panel
    </h2>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "18px",
      }}
    >
      {splitStoryboard(storyboard).map((scene, index) => (
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
        marginTop: "24px",
        padding: "12px 16px",
        border: "1px solid #51436e",
        borderRadius: "10px",
        background: "transparent",
        color: "#c4b5fd",
        cursor: "pointer",
      }}
    >
      Salin seluruh storyboard
    </button>

    {copyMessage && (
      <p role="status" style={{ color: "#c4b5fd", fontSize: "13px" }}>
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
          FRAMEFORGE AI · Built for cinematic ideas
        </footer>
      </div>
    </main>
  );
}
