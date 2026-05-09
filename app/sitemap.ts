import type { MetadataRoute } from "next";
import { siteUrl } from "./seo";

const lastModified = new Date("2026-05-09");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/data-engine`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/book`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
