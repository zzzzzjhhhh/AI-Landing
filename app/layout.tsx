import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

const titilliumWeb = Titillium_Web({
  weight: ["300", "400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-titillium-web",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oceanveo.ai"),
  title: "Oceanveo | Data for Physical Intelligence",
  description:
    "Oceanveo provides VLA-ready video trajectories and expert-collected real-world datasets for robotics and autonomy teams.",
  openGraph: {
    title: "Oceanveo | Data for Physical Intelligence",
    description:
      "Oceanic-scale real-world data engineered to train and refine world models.",
    type: "website",
    url: "/",
    images: ["/favicon.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oceanveo | Data for Physical Intelligence",
    description:
      "Oceanic-scale real-world data engineered to train and refine world models.",
    images: ["/favicon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={titilliumWeb.variable}>
      <body>
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          <Providers>{children}</Providers>
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
