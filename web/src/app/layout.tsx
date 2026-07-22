import type { Metadata } from "next";
import { NavHeader } from "@/components/NavHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "PROVJERI — platforma provjerenih kompetencija",
  description:
    "Vektorsko uparivanje tražitelja posla i poslodavaca na temelju empirijski provjerenih, ESCO-mapiranih kompetencija.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <NavHeader />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
