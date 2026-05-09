import type { Metadata } from "next";
import BookCall from "@/pages/BookCall";
import {
  JsonLd,
  breadcrumbJsonLd,
  createPageMetadata,
  siteUrl,
} from "../seo";

export const metadata: Metadata = createPageMetadata({
  title: "Contact Oceanveo",
  description:
    "Contact Oceanveo to discuss robotics training data, video trajectories, annotation previews, and dataset requirements.",
  path: "/book",
});

const contactPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Oceanveo",
  description:
    "Contact Oceanveo to discuss robotics training data and dataset requirements.",
  url: `${siteUrl}/book`,
  mainEntity: {
    "@type": "Organization",
    name: "Oceanveo",
    url: siteUrl,
  },
};

export default function BookCallPage() {
  return (
    <>
      <BookCall />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/book" },
        ])}
      />
      <JsonLd data={contactPageJsonLd} />
    </>
  );
}
