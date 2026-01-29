import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jarvis 2nd Brain",
  description: "Your living knowledge base and daily journal.",
};

/**
 * App root layout that wraps page content in the top-level HTML and body elements,
 * applying the configured Geist fonts and the `app-body` class.
 *
 * @param children - The page or application content to render inside the body.
 * @returns The root JSX element containing `<html lang="en">` and the themed `<body>`.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} app-body`}>
        {children}
      </body>
    </html>
  );
}