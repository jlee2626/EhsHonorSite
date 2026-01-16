import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import SessionManager from "@/components/SessionManager";

export const metadata: Metadata = {
  title: "EHS Honor Site",
  description: "Private site for EHS community",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <NavBar />
        <SessionManager />
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
