import type { OgMeta } from "./og-fetch";
import { DEFAULT_CATEGORY } from "./categories";

/**
 * Everything the claimer used to type by hand is now derived from the page
 * itself. og-fetch never throws, so a dead or hostile site just falls back
 * to the domain name and an empty pitch — never blocks the claim.
 */
export function deriveCardFields(og: OgMeta, domain: string) {
  const productName = (og.title || og.siteName || domain).trim().slice(0, 60) || domain;
  const tagline = (og.description ?? "").trim().slice(0, 90);
  const category = DEFAULT_CATEGORY;
  const logoUrl = og.imageUrl || og.favicon || null;
  return { productName, tagline, category, logoUrl };
}
