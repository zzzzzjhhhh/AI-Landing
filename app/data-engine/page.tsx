import type { Metadata } from "next";
import DataEngine from "@/pages/DataEngine";
import {
  JsonLd,
  breadcrumbJsonLd,
  createPageMetadata,
  siteUrl,
} from "../seo";

export const metadata: Metadata = createPageMetadata({
  title: "Robotics Data Engine",
  description:
    "See how Oceanveo collects, structures, validates, and delivers real-world robotics training data for physical AI teams.",
  path: "/data-engine",
});

const dataEngineJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Oceanveo Data Engine",
  provider: {
    "@type": "Organization",
    name: "Oceanveo",
    url: siteUrl,
  },
  areaServed: "Worldwide",
  serviceType: "Robotics data engine",
  description:
    "A system for collecting, structuring, validating, and delivering real-world robotics training data from physical environments.",
  url: `${siteUrl}/data-engine`,
};

export default function DataEnginePage() {
  return (
    <>
      <DataEngine />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Data Engine", path: "/data-engine" },
        ])}
      />
      <JsonLd data={dataEngineJsonLd} />
    </>
  );
}
