import type { Metadata } from "next";

export const siteUrl = "https://www.oceanveo.ai";
export const siteName = "Oceanveo";
export const defaultOgImage = "/opengraph-image";

type PageMetadataInput = {
  description: string;
  path: string;
  title: string;
};

export function createPageMetadata({
  description,
  path,
  title,
}: PageMetadataInput): Metadata {
  const url = path === "/" ? siteUrl : `${siteUrl}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_US",
      siteName,
      url,
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: `${siteName} - Data for Physical Intelligence`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
    },
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/icon.png`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sunnyvale",
    addressRegion: "CA",
    addressCountry: "US",
  },
  description:
    "Oceanveo provides real-world video trajectories and expert-collected datasets for robotics, humanoids, and autonomous systems.",
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  description:
    "Real-world intelligence infrastructure for embodied AI and robotics teams.",
};

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? siteUrl : `${siteUrl}${item.path}`,
    })),
  };
}
