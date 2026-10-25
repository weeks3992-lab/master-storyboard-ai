 "use client";
import { useMemo, useState } from "react";

type Scene = {
  scene: number; title: string; duration: string; location: string; time_of_day: string;
  shot_type: string; camera_movement: string; composition: string; action: string;
  dialogue: string; lighting_color: string; sound: string; continuity: string;
  image_prompt: string;
};
type Board = { project_title: string; logline: string; visual_style: string; aspect_ratio: string; estimated_duration: string; scenes: Scene[] };

const example = "Seorang kurir muda menemukan robot kecil yang rusak di gang kota futuristik saat hujan. Ia memperbaikinya, lalu robot itu membawanya ke atap gedung untuk melihat matahari terbit. Nuansa sci-fi emosional, sinematik, tanpa kekerasan.";
const styles = ["Sinematik realistis", "Anime film", "Stop-motion clay", "Komik noir", "Iklan premium", "Fantasi epik", "Dokumenter", "Custom"];
const blankBoard: Board = {project_title:"Storyboard baru",logline:"",visual_style:"",aspect_ratio:"16:9",estimated_duration:"",scenes:[]};

export default function Home() {
  const [prompt,setPrompt] = useState("");
  const [style,setStyle] = useState(styles[0]);
  const [sceneCount,setSceneCount] = useState(8);
  const [duration,setDuration] = useState("60–90 detik");
  const [language,setLanguage] = useState("Bahasa Indonesia");
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [board,setBoard] = useState<Board|null>(null);
  const [active,setActive] = useState(0);
  const [customStyle,setCustomStyle] = useState("");
  const [copied,setCopied] = useState(false);
  const [sceneImages,setSceneImages] = useState<Record<number,string>>({});
  const [imageLoading,setImageLoading] = useState(false);
  const [imageErrors,setImageErrors] = useState<Record<number,string>>({});
  const [characterSheet,setCharacterSheet] = useState<string>("");
  const [characterSheetLoading,setCharacterSheetLoading] = useState(false);
  const [characterSheetError,setCharacterSheetError] = useState("");

  const current = board?.scenes[active];
  const exportText = useMemo(()=> board ? JSON.stringify(board,null,2) : "",[board]);

  async function generate() {
    if (!prompt.trim()) { setError("Masukkan prompt cerita terlebih dahulu."); return; }
    setLoading(true); setError(""); setBoard(null); setActive(0); setSceneImages({}); setImageErrors({}); setCharacterSheet(""); setCharacterSheetError("");
    try {
      const res = await fetch("/api/storyboard",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,style:style==="Custom"?(customStyle||"Sinematik realistis"):style,sceneCount,duration,language})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat storyboard.");
      setBoard(data);
    } catch(e) { setError(e instanceof Error ? e.message : "Terjadi kesalahan."); }
    finally { setLoading(false); }
  }

  function download() {
    if (!board) return;
    const blob = new Blob([JSON.stringify(board,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href=url; a.download="master-storyboard.json"; a.click(); URL.revokeObjectURL(url);
  }
  async function copyPrompt(text:string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),1400); } catch {}
  }

  async function generateCharacterSheet() {
    if (!board) return;
    setCharacterSheetLoading(true);
    setCharacterSheetError("");
    try {
      const res = await fetch("/api/character-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          projectTitle: board.project_title,
          logline: board.logline,
          visualStyle: board.visual_style || style,
          scenes: board.scenes.map((scene) => ({ title: scene.title, action: scene.action, continuity: scene.continuity, image_prompt: scene.image_prompt })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Character sheet gagal dibuat. Silakan coba lagi.");
      if (!data.imageData) throw new Error("Model tidak mengembalikan gambar. Periksa akses model gambar di akun Gemini API.");
      setCharacterSheet(`data:${data.mimeType || "image/jpeg"};base64,${data.imageData}`);
    } catch (e) {
      setCharacterSheetError(e instanceof Error ? e.message : "Terjadi kesalahan saat membuat character sheet.");
    } finally {
      setCharacterSheetLoading(false);
    }
  }

  async function generateSceneImage(scene: Scene) {
    setImageLoading(true);
    setImageErrors(previous => ({ ...previous, [scene.scene]: "" }));
    try {
      const res = await fetch("/api/scene-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: scene.image_prompt, style: board?.visual_style || style, aspectRatio: "16:9" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gambar gagal dibuat. Silakan coba lagi.");
      if (!data.imageData) throw new Error("Model tidak mengembalikan data gambar. Coba lagi nanti.");
      setSceneImages(previous => ({ ...previous, [scene.scene]: `data:${data.mimeType || "image/jpeg"};base64,${data.imageData}` }));
    } catch (e) {
      setImageErrors(previous => ({ ...previous, [scene.scene]: e instanceof Error ? e.message : "Terjadi kesalahan saat membuat gambar." }));
    } finally {
      setImageLoading(false);
    }
  }

  return <main className="shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brandIcon">F</span><span>FRAMEFORGE<small>STORYBOARD STUDIO</small></span></a>
      <div className="topRight"><span className="statusDot"/> AI STORY DEVELOPMENT <span className="version">BETA 01</span></div>
    </header>
    <section className="hero">
      <div className="eyebrow"><span/> FROM PROMPT TO PICTURE</div>
      <h1>Bangun cerita.<br/><em>Lihat setiap frame.</em></h1>
      <p className="heroSub">Ubah ide mentah menjadi master storyboard yang terstruktur, sinematik, dan siap dikembangkan—scene demi scene dalam format 16:9.</p>
    </section>
    <section className="workspace">
      <aside className="controlPanel">
        <div className="panelHeading"><div><span className="step">01</span><h2>Story brief</h2></div><span className="required">REQUIRED</span></div>
        <label htmlFor="prompt">CERITAKAN IDE ANDA</label>
        <textarea id="prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Jelaskan karakter, tujuan, konflik, dunia, dan akhir cerita..." rows={7}/>
        <div className="quickExample"><span>Butuh inspirasi?</span><button onClick={()=>setPrompt(example)}>Gunakan contoh ↗</button></div>
        <div className="fieldGrid">
          <div><label>GAYA VISUAL</label><select value={style} onChange={e=>setStyle(e.target.value)}>{styles.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label>JUMLAH SCENE</label><select value={sceneCount} onChange={e=>setSceneCount(Number(e.target.value))}>{[4,6,8,10,12,16].map(n=><option key={n} value={n}>{n} scene</option>)}</select></div>
          <div><label>ESTIMASI DURASI</label><select value={duration} onChange={e=>setDuration(e.target.value)}>{["15–30 detik","30–60 detik","60–90 detik","2–3 menit","5 menit+"].map(d=><option key={d}>{d}</option>)}</select></div>
          <div><label>BAHASA OUTPUT</label><select value={language} onChange={e=>setLanguage(e.target.value)}><option>Bahasa Indonesia</option><option>English</option></select></div>
        </div>
        {style==="Custom" && <div className="customStyle"><label>GAYA KUSTOM</label><input value={customStyle} onChange={e=>setCustomStyle(e.target.value)} placeholder="Contoh: analog 35mm, grain halus..."/></div>}
        <div className="ratioRow"><div><span className="ratioIcon">▱</span><div><b>Aspect ratio</b><small>Format frame sinematik standar</small></div></div><strong>16:9</strong></div>
        {error && <div className="error">{error}</div>}
        <button className="generateBtn" onClick={generate} disabled={loading}>{loading?<><span className="spinner"/> MENYUSUN STORYBOARD...</>:<>✦ &nbsp; GENERATE MASTER STORYBOARD <span>→</span></>}</button>
        <p className="privacyNote"><span>▣</span> API key diproses di server. Jangan bagikan key di prompt.</p>
      </aside>

      <section className="outputPanel">
        {!board && !loading && <div className="emptyState">
          <div className="emptyGraphic"><div className="frame f1"><span>01</span><i>◌</i></div><div className="frame f2"><span>02</span><i>⌁</i></div><div className="frame f3"><span>03</span><i>✳</i></div><div className="play">▶</div></div>
          <span className="emptyKicker">YOUR CREATIVE CANVAS</span><h2>Ide Anda, frame demi frame.</h2><p>Storyboard yang dihasilkan akan tampil di sini lengkap dengan arahan visual, kamera, aksi, dialog, pencahayaan, dan kontinuitas tiap scene.</p>
          <div className="emptyFeatures"><span>✦ Shot direction</span><span>✦ Visual prompts</span><span>✦ Continuity notes</span></div>
        </div>}
        {loading && <div className="loadingState"><div className="loaderOrb">✦</div><h2>Merangkai cerita menjadi frame…</h2><p>AI sedang menyusun alur, shot, aksi, dan detail visual yang konsisten.</p><div className="loadingBar"><span/></div><small>Biasanya perlu beberapa detik</small></div>}
        {board && <>
          <div className="boardTop"><div><div className="eyebrow"><span/> MASTER STORYBOARD</div><h2>{board.project_title}</h2><p>{board.logline}</p></div><button className="exportBtn" onClick={download}>↓ <span>EXPORT JSON</span></button></div>
          <div className="characterSheetPanel">
            <div className="characterSheetIntro">
              <div><span className="infoLabel">KONSISTENSI KARAKTER</span><h3>Character Sheet Realistis</h3><p>AI mendeteksi karakter penting dari prompt cerita dan adegan, lalu membuat lembar referensi visual untuk beberapa karakter sekaligus—tampak depan, samping, belakang, dan close-up wajah.</p></div>
              <button className="characterSheetBtn" onClick={generateCharacterSheet} disabled={characterSheetLoading}>
                {characterSheetLoading ? <><span className="spinner"/> MEMBUAT CHARACTER SHEET...</> : characterSheet ? "↻ BUAT ULANG CHARACTER SHEET" : "✦ DETEKSI KARAKTER & BUAT SHEET"}
              </button>
            </div>
            {characterSheetError && <div className="error imageError">{characterSheetError}</div>}
            {characterSheet && <div className="characterSheetResult"><img src={characterSheet} alt="Character sheet realistis berdasarkan prompt cerita"/><p>Gunakan gambar ini sebagai referensi visual agar karakter tetap konsisten antar-adegan.</p></div>}
          </div>
          <div className="boardMeta"><span><b>{board.scenes.length}</b> SCENES</span><span><b>16:9</b> ASPECT RATIO</span><span><b>{board.estimated_duration||duration}</b> EST. DURATION</span></div>
          <div className="sceneStrip">{board.scenes.map((s,i)=><button key={s.scene} className={active===i?"sceneThumb selected":"sceneThumb"} onClick={()=>setActive(i)}><span className="thumbNum">{String(s.scene).padStart(2,"0")}</span><span className="thumbArt" style={{"--sceneHue":`${(i*43+195)%360}`} as React.CSSProperties}>{sceneImages[s.scene] ? <img src={sceneImages[s.scene]} alt={`Visual ${s.title}`} /> : <i>{["◒","⌁","△","✳","◌","◈"][i%6]}</i>}</span><span className="thumbTitle">{s.title}</span></button>)}</div>
          {current && <div className="sceneDetail">
            <div className="sceneHeading"><div><span className="sceneLabel">SCENE {String(current.scene).padStart(2,"0")} / {String(board.scenes.length).padStart(2,"0")}</span><h3>{current.title}</h3></div><span className="durationChip">{current.duration}</span></div>
            <div className="visualFrame" style={{"--sceneHue":`${(active*43+195)%360}`} as React.CSSProperties}>
              {sceneImages[current.scene] ? <img className="generatedSceneImage" src={sceneImages[current.scene]} alt={`Visual adegan ${current.scene}: ${current.title}`} /> : <div className="abstractScene"><div className="sun"/><div className="mountain m1"/><div className="mountain m2"/><div className="ground"/><div className="figure"><i/></div><div className="sceneCaption">{current.location || "VISUAL FRAME"} <span>•</span> {current.time_of_day || "DAY"}</div></div>}
              <div className="visualOverlay"><span className="frameBadge">FRAME {String(current.scene).padStart(2,"0")}</span><span className="frameRatio">16:9</span></div>
              {!sceneImages[current.scene] && <div className="visualNotice">PRATINJAU SEMENTARA · buat gambar AI di bawah</div>}
            </div>
            <div className="imageGenerateRow">
              <button className="generateImageBtn" onClick={() => generateSceneImage(current)} disabled={imageLoading}>
                {imageLoading ? <><span className="spinner"/> SEDANG MEMBUAT GAMBAR...</> : sceneImages[current.scene] ? "↻ BUAT ULANG GAMBAR ADEGAN" : "✦ BUAT GAMBAR AI UNTUK ADEGAN INI"}
              </button>
              <span className="imageCostNote">Memerlukan akses model gambar Gemini.</span>
            </div>
            {imageErrors[current.scene] && <div className="error imageError">{imageErrors[current.scene]}</div>}
            <div className="sceneInfoGrid">
              <div className="infoCard"><span className="infoLabel">SHOT & CAMERA</span><h4>{current.shot_type}</h4><p>{current.camera_movement}</p></div>
              <div className="infoCard"><span className="infoLabel">COMPOSITION</span><p>{current.composition}</p></div>
              <div className="infoCard wide"><span className="infoLabel">ACTION / BEAT</span><p>{current.action}</p></div>
              <div className="infoCard"><span className="infoLabel">LIGHT & COLOR</span><p>{current.lighting_color}</p></div>
              <div className="infoCard"><span className="infoLabel">SOUND DESIGN</span><p>{current.sound}</p></div>
              <div className="infoCard wide"><span className="infoLabel">DIALOGUE</span><p className="dialogue">{current.dialogue || "— Tanpa dialog —"}</p></div>
              <div className="infoCard wide continuity"><span className="infoLabel">CONTINUITY NOTES</span><p>{current.continuity}</p></div>
            </div>
            <div className="imagePromptBox"><div><span className="infoLabel">IMAGE GENERATION PROMPT</span><p>{current.image_prompt}</p></div><button onClick={()=>copyPrompt(current.image_prompt)}>{copied?"✓ COPIED":"COPY PROMPT"}</button></div>
            <div className="sceneNav"><button onClick={()=>setActive(Math.max(0,active-1))} disabled={active===0}>← PREVIOUS SCENE</button><span>{active+1} <i>/</i> {board.scenes.length}</span><button onClick={()=>setActive(Math.min(board.scenes.length-1,active+1))} disabled={active===board.scenes.length-1}>NEXT SCENE →</button></div>
          </div>}
        </>}
      </section>
    </section>
    <footer><span>FRAMEFORGE © 2026</span><span>BUILT FOR VISUAL STORYTELLERS</span><span>16:9 · SCENE BY SCENE</span></footer>
  </main>;
}
