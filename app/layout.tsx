import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "FrameForge — Master Storyboard",
  description: "Ubah prompt menjadi master storyboard sinematik scene-by-scene."
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="id"><body>{children}</body></html>;
}