import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { SERVICES } from "@/lib/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/trust-safety`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/services`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = SERVICES.map((service) => ({
    url: `${SITE_URL}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  // PHASE 3+: append programmatically generated service/city pages here, e.g.
  //
  // const serviceCityPages: MetadataRoute.Sitemap = SERVICES.flatMap((service) =>
  //   CITIES.map((city) => ({
  //     url: `${SITE_URL}/services/${service.slug}/${city.slug}`,
  //     lastModified: new Date(),
  //     changeFrequency: "weekly",
  //     priority: 0.7,
  //   }))
  // );
  // return [...staticRoutes, ...serviceRoutes, ...serviceCityPages];

  return [...staticRoutes, ...serviceRoutes];
}
