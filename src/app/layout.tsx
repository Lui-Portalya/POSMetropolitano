import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POS Metropolitano",
  description: "Simple point of sale for the church cafeteria",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-stone-100 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
