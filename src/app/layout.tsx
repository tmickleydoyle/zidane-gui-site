import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/app.css";
import "../styles/palette.css";
import "../styles/sections.css";
import "../styles/tour.css";
import "../styles/bento.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zidane. The coding agent that goes straight to the goal",
  description:
    "Hand Zidane a task and watch it work: it searches, edits, runs your tests and checks with you before anything risky. Chat, code review, a terminal and a browser in one desktop app for macOS and Linux.",
  icons: { icon: "/favicon-32.png", apple: "/icon-512.png" },
};

export const viewport: Viewport = { themeColor: "#0a0e13", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geist.variable + " " + geistMono.variable}>
      <body>{children}</body>
    </html>
  );
}
