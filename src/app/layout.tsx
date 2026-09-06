import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { company } from "@/data/company";
import "./globals.css";
const geist = localFont({
  src: "../../public/fonts/geist-latin.woff2",
  variable: "--font-geist",
  display: "swap",
  weight: "100 900",
});
const display = localFont({
  src: "../../public/fonts/barlow-condensed-600.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "600",
});
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: company.title,
  description: company.description,
  openGraph: {
    title: company.title,
    description: company.description,
    type: "website",
    siteName: company.name,
    locale: "en_US",
    images: siteUrl
      ? [
          {
            url: "/images/brand/material-study.webp",
            width: 1672,
            height: 941,
            alt: "Conceptual Redline protective textile study",
          },
        ]
      : [],
  },
  twitter: { card: "summary_large_image", title: company.title, description: company.description },
};
export const viewport: Viewport = { themeColor: "#080A0C" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${display.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
