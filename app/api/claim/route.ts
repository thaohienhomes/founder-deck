import { NextResponse } from "next/server";
import { sql, eq } from "drizzle-orm";
import { z } from "zod";

import { db, asRows, claimCheckouts } from "@/lib/db";
import { normalizeDomain } from "@/lib/format";
import { fetchOgMeta } from "@/lib/og-fetch";
import { deriveCardFields } from "@/lib/derive-card";
import { claimTierForNumber, polarProductIdForTier } from "@/lib/economy";
import { reserveClaimCheckout, markCheckoutFailed, getClaimCheckout, fulfillClaim } from "@/lib/claim";
import { PAYMENTS_SIMULATED, createClaimCheckout } from "@/lib/polar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCENTS = ["amber", "violet", "sky", "emerald", "rose"];

const Body = z.object({
  websiteUrl: z.string().trim().min(4).max(200),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
});

/** Cheap best-effort liveness check. A site that answers gets the verified seal. */
async function looksLive(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": "FounderDeckBot/1.0 (+claim verification)" },
    });
    clearTimeout(t);
    return res.status < 500;
  } catch {
    return false;
  }
}

/** Claiming is paid, but a burst of checkouts from one IP is still worth capping. */
const MAX_CLAIMS_PER_IP_PER_HOUR = 3;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  const ip = clientIp(req);

  const recent = asRows(
    await db.execute(
      sql`select count(*)::int as n from cards
          where claim_ip = ${ip} and claimed_at > now() - interval '1 hour'`,
    ),
  );
  if (Number(recent[0]?.n ?? 0) >= MAX_CLAIMS_PER_IP_PER_HOUR) {
    return NextResponse.json(
      { error: "Too many claims from here in the last hour. Try again later." },
      { status: 429 },
    );
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input" : "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let domain: string;
  let websiteUrl: string;
  try {
    domain = normalizeDomain(body.websiteUrl);
    websiteUrl = /^https?:\/\//i.test(body.websiteUrl) ? body.websiteUrl : `https://${body.websiteUrl}`;
    if (!domain.includes(".")) throw new Error("bad domain");
  } catch {
    return NextResponse.json({ error: "That doesn't look like a website address" }, { status: 400 });
  }

  const dupe = asRows(
    await db.execute(
      sql`select slug from cards where normalized_domain = ${domain} and season_id = 1 limit 1`,
    ),
  );
  if (dupe.length) {
    return NextResponse.json(
      { error: `${domain} already has a card in Season 01.`, slug: String(dupe[0].slug) },
      { status: 409 },
    );
  }
  const pendingDupe = asRows(
    await db.execute(sql`
      select 1 from claim_checkouts
      where normalized_domain = ${domain} and status = 'pending' and expires_at > now()
      limit 1
    `),
  );
  if (pendingDupe.length) {
    return NextResponse.json(
      { error: `${domain} already has a claim checkout in progress. Try again shortly.` },
      { status: 409 },
    );
  }

  const [verified, og] = await Promise.all([looksLive(websiteUrl), fetchOgMeta(websiteUrl)]);
  const { productName, tagline, category, logoUrl } = deriveCardFields(og, domain);
  const accent = ACCENTS[Math.floor(Math.random() * ACCENTS.length)];

  // Reserves a claim number and writes a pending checkout. No card exists yet —
  // the product's own page names it, never the client; the tier fee is
  // resolved from whichever number this lands on. The owner can correct or
  // enrich any of these fields after payment via their owner token.
  const checkout = await reserveClaimCheckout({
    productName,
    tagline,
    category,
    websiteUrl,
    normalizedDomain: domain,
    xHandle: null,
    logoUrl,
    founderEmail: body.email || null,
    accent,
    claimIp: ip,
    isVerified: verified,
  });
  if (!checkout) {
    return NextResponse.json({ error: "Season 01 is full" }, { status: 409 });
  }

  // ── prototype mode: no money moves, every other code path is identical ──
  if (PAYMENTS_SIMULATED) {
    const result = await fulfillClaim(checkout.id, `sim_${checkout.id}`);
    if (result.already || !("slug" in result)) {
      return NextResponse.json({ error: "Already claimed" }, { status: 409 });
    }
    return NextResponse.json({
      simulated: true,
      slug: result.slug,
      claimNumber: result.claimNumber,
      ownerToken: result.ownerToken,
      verified: result.isVerified,
    });
  }

  // ── live mode ──
  const tier = claimTierForNumber(checkout.claimNumber);
  const productId = polarProductIdForTier(tier.key);
  if (!productId) {
    await markCheckoutFailed(checkout.id);
    return NextResponse.json(
      { error: `No Polar product configured for the ${tier.label} tier` },
      { status: 500 },
    );
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  try {
    const { url, providerCheckoutId } = await createClaimCheckout({
      productId,
      checkoutId: checkout.id,
      claimNumber: checkout.claimNumber,
      successUrl: `${site}/claim/pending?checkout_id=${checkout.id}`,
      customerEmail: body.email || null,
    });
    await db
      .update(claimCheckouts)
      .set({ providerCheckoutId })
      .where(eq(claimCheckouts.id, checkout.id));
    return NextResponse.json({
      checkoutUrl: url,
      claimNumber: checkout.claimNumber,
      feeCents: tier.cents,
    });
  } catch (e) {
    console.error("polar claim checkout failed", e);
    await markCheckoutFailed(checkout.id);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
  }
}

/**
 * Status poll for the pending-payment screen. Read-only — the browser can
 * only observe state the webhook already committed, never grant a claim.
 */
export async function GET(req: Request) {
  const checkoutId = new URL(req.url).searchParams.get("checkoutId");
  if (!checkoutId) return NextResponse.json({ error: "checkoutId required" }, { status: 400 });

  const co = await getClaimCheckout(checkoutId);
  if (!co) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (co.status !== "paid" || !co.cardId) {
    return NextResponse.json({ status: co.status });
  }

  const cardRows = asRows(
    await db.execute(sql`select slug from cards where id = ${co.cardId} limit 1`),
  );
  if (!cardRows.length) return NextResponse.json({ status: "paid" });

  return NextResponse.json({
    status: "paid",
    slug: String(cardRows[0].slug),
    ownerToken: co.ownerToken,
  });
}
