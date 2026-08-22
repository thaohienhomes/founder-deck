import { NextResponse } from "next/server";

import { normalizeDomain } from "@/lib/format";
import { fetchOgMeta } from "@/lib/og-fetch";
import { deriveCardFields } from "@/lib/derive-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only preview for the claim form — never touches the database, never
 * reserves a claim number. Same SSRF-safe fetch the claim route itself uses,
 * so a preview can never see (or leak) anything the real claim couldn't.
 */
export async function GET(req: Request) {
  const raw = (new URL(req.url).searchParams.get("url") ?? "").trim();
  if (!raw || raw.length > 200) {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }

  let domain: string;
  let websiteUrl: string;
  try {
    domain = normalizeDomain(raw);
    websiteUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    if (!domain.includes(".")) throw new Error("bad domain");
  } catch {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }

  const og = await fetchOgMeta(websiteUrl);
  const { productName, tagline, logoUrl } = deriveCardFields(og, domain);
  return NextResponse.json({ productName, tagline, logoUrl, domain });
}
