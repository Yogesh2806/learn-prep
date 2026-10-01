import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font, so the typography works offline too.
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-grotesk", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--font-source-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Learn Prep",
  description: "Flashcards, quizzes and AI-assisted teaching for product-design interviews and everyday English.",
  applicationName: "Learn Prep",
  appleWebApp: { capable: true, title: "Learn Prep", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f100d" },
  ],
};

// Runs before first paint so there's no light flash for dark-mode users.
const THEME_BOOT = `(function(){try{var t=localStorage.getItem('lp.theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.add(t)}catch(e){document.documentElement.classList.add('light')}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${grotesk.variable} ${serif.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-full bg-paper text-ink">{children}</body>
    </html>
  );
}
