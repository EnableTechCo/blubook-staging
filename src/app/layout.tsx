import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BluBook",
  description:
    "Managed business services coordinated through one traceable operating workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
