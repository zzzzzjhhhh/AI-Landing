import type { Metadata } from "next";
import Home from "@/pages/Home";
import { JsonLd, createPageMetadata, siteUrl } from "./seo";

export const metadata: Metadata = createPageMetadata({
  title: "Real-World Robotics Training Data | Oceanveo",
  description:
    "Oceanveo provides VLA-ready video trajectories and expert-collected datasets for robotics, humanoids, and autonomous systems.",
  path: "/",
});

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Real-world robotics training data",
  provider: {
    "@type": "Organization",
    name: "Oceanveo",
    url: siteUrl,
  },
  areaServed: "Worldwide",
  serviceType: "Robotics training data collection and annotation",
  description:
    "Expert-collected real-world video trajectories and structured datasets for robotics, humanoids, and autonomous systems.",
  url: siteUrl,
};

export default function Page() {
  return (
    <>
      <Home />
      <JsonLd data={serviceJsonLd} />
    </>
  );
}
