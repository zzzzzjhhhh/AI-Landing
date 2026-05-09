import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import type { Viewport } from "next";
import { Titillium_Web } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";
import {
  defaultOgImage,
  JsonLd,
  organizationJsonLd,
  siteName,
  siteUrl,
  websiteJsonLd,
} from "./seo";

const titilliumWeb = Titillium_Web({
  weight: ["300", "400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-titillium-web",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: "Real-World Robotics Training Data | Oceanveo",
    template: "%s | Oceanveo",
  },
  description:
    "Oceanveo provides VLA-ready video trajectories and expert-collected real-world datasets for robotics, humanoids, and autonomy teams.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Real-World Robotics Training Data | Oceanveo",
    description:
      "VLA-ready video trajectories and expert-collected real-world datasets for robotics and autonomy teams.",
    type: "website",
    locale: "en_US",
    siteName,
    url: "/",
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "Oceanveo - Data for Physical Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Real-World Robotics Training Data | Oceanveo",
    description:
      "VLA-ready video trajectories and expert-collected real-world datasets for robotics and autonomy teams.",
    images: [defaultOgImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020a18",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={titilliumWeb.variable}>
      <body>
        <Providers>{children}</Providers>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <Analytics />
      </body>
    </html>
  );
}
