
export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#101014",
      color: "#ffffff",
      padding: "64px 24px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <p style={{ color: "#a78bfa", fontWeight: 700 }}>
          FRAMEFORGE AI
        </p>
        <h1 style={{ fontSize: "clamp(36px, 7vw, 64px)" }}>
          Turn your story into a storyboard.
        </h1>
        <p style={{ color: "#b8b8c5", lineHeight: 1.7 }}>
          Your creative workspace for planning scenes,
          visualizing stories, and building cinematic ideas.
        </p>
        <p style={{ marginTop: 32, color: "#a78bfa" }}>
          FrameForge AI is deployed. More creative tools coming soon.
        </p>
      </div>
    </main>
  );
}
