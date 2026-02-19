import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "{{projectName}}",
  description: "Scaffolded with Takohemi CLI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
