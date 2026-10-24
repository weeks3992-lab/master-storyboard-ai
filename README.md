# FrameForge — Master Storyboard AI

Aplikasi web Next.js untuk mengubah prompt cerita menjadi master storyboard scene-by-scene.

## Fitur
- Input prompt, gaya visual, jumlah scene, durasi, dan bahasa.
- Setiap scene berisi shot type, pergerakan kamera, komposisi, aksi, dialog, lighting, sound, continuity notes, dan prompt gambar.
- Panel preview 16:9 dan navigasi antar-scene.
- Salin prompt gambar per scene dan ekspor storyboard sebagai JSON.
- API key hanya dibaca oleh route server; tidak ditaruh di browser.

> Catatan visual: preview frame saat ini berupa placeholder komposisi 16:9, bukan gambar final yang dihasilkan AI. `image_prompt` disediakan agar bisa dipakai di generator gambar pilihan Anda. Untuk gambar final otomatis, integrasikan model image-generation yang tersedia pada akun Anda.

## Menjalankan
1. Install Node.js 20+.
2. Ekstrak folder proyek, lalu jalankan `npm install`.
3. Salin `.env.example` menjadi `.env.local`.
4. Isi `GEMINI_API_KEY` dengan key Anda. Jangan commit `.env.local` ke Git.
5. Pastikan `GEMINI_MODEL` sesuai dengan model yang benar-benar tersedia untuk API key Anda.
6. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.

## Troubleshooting
- Jika mendapat 404/unsupported model, cek nama model yang tersedia untuk key Anda lalu ubah `GEMINI_MODEL`.
- Jika API mengembalikan 400 untuk `responseMimeType`, cek dukungan JSON mode pada model; Anda dapat menghapus `responseMimeType: "application/json"` di `app/api/storyboard/route.ts`.
- Untuk deploy, set variabel environment di server hosting. Jangan menaruh API key di variabel `NEXT_PUBLIC_*`.
