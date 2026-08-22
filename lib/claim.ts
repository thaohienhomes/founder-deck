import { sql, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, claimCheckouts, asRows } from "./db";
import { claimTierForNumber, SEASON_CAPACITY } from "./economy";
import { slugify } from "./format";

export const CLAIM_RESERVATION_MINUTES = 30;

export type PendingClaim = {
  productName: string;
  tagline: string;
  category: string;
  websiteUrl: string;
  normalizedDomain: string;
  xHandle: string | null;
  logoUrl: string | null;
  founderEmail: string | null;
  accent: string;
  claimIp: string | null;
  isVerified: boolean;
};

/**
 * Reserve the next sequential claim number and write a pending checkout row.
 * No money moves here and nothing lands in `cards` yet — a claim number only
 * becomes permanent once the webhook confirms payment (see fulfillClaim).
 *
 * Numbering stays sequential like the old free-claim path (same advisory
 * lock), but a number is only "spent" by a *live* reservation: an expired or
 * failed checkout drops out of the max() below, so its number is handed to
 * the next claimer instead of being burned forever.
 */
export async function reserveClaimCheckout(pending: PendingClaim) {
  const id = nanoid(21);
  const ownerToken = nanoid(24);
  const expiresAt = new Date(Date.now() + CLAIM_RESERVATION_MINUTES * 60_000);

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(74210001)`);

    const next = await tx.execute(sql`
      select greatest(
        coalesce((select max(claim_number) from cards where season_id = 1), 0),
        coalesce(
          (select max(claim_number) from claim_checkouts
           where status = 'pending' and expires_at > now()),
          0
        )
      ) + 1 as n
    `);
    const claimNumber = Number(asRows(next)[0].n);
    if (claimNumber > SEASON_CAPACITY) return null;

    const tier = claimTierForNumber(claimNumber);

    const [row] = await tx
      .insert(claimCheckouts)
      .values({
        id,
        claimNumber,
        tier: tier.key,
        feeCents: tier.cents,
        productName: pending.productName,
        tagline: pending.tagline,
        category: pending.category,
        websiteUrl: pending.websiteUrl,
        normalizedDomain: pending.normalizedDomain,
        xHandle: pending.xHandle,
        logoUrl: pending.logoUrl,
        founderEmail: pending.founderEmail,
        accent: pending.accent,
        ownerToken,
        claimIp: pending.claimIp,
        isVerified: pending.isVerified,
        status: "pending",
        expiresAt,
      })
      .returning();

    return row;
  });
}

/** Immediate release — used when checkout creation with the provider fails synchronously. */
export async function markCheckoutFailed(checkoutId: string) {
  await db
    .update(claimCheckouts)
    .set({ status: "failed" })
    .where(eq(claimCheckouts.id, checkoutId));
}

export async function getClaimCheckout(checkoutId: string) {
  const [row] = await db
    .select()
    .from(claimCheckouts)
    .where(eq(claimCheckouts.id, checkoutId))
    .limit(1);
  return row ?? null;
}

/**
 * Apply a paid claim. Called ONLY from a verified webhook (or the
 * SIMULATE_PAYMENTS dev path). The only place a claim checkout may turn into
 * a permanent card — the claim fee is recorded but never added to
 * total_bid_cents, and the card starts at rank parity with every other fresh
 * claim (bid_reached_at = now, total_bid_cents = 0).
 */
export async function fulfillClaim(checkoutId: string, orderId?: string) {
  return db.transaction(async (tx) => {
    const locked = asRows(
      await tx.execute(sql`select * from claim_checkouts where id = ${checkoutId} for update`),
    );
    if (!locked.length) throw new Error(`claim checkout ${checkoutId} not found`);
    const co = locked[0] as Record<string, unknown>;

    if (String(co.status) === "paid") {
      return {
        already: true as const,
        cardId: co.card_id == null ? null : Number(co.card_id),
      };
    }

    // never trust anything but our own stored intent for the fee amount
    const tier = claimTierForNumber(Number(co.claim_number));
    if (tier.cents !== Number(co.fee_cents)) {
      throw new Error(`claim fee drift for checkout ${checkoutId}`);
    }

    const base = slugify(String(co.product_name)) || `card-${nanoid(6).toLowerCase()}`;
    let slug = base;
    for (let i = 2; i < 40; i++) {
      const taken = await tx.execute(sql`select 1 from cards where slug = ${slug} limit 1`);
      if (!asRows(taken).length) break;
      slug = `${base}-${i}`;
    }

    let inserted: Record<string, unknown>[];
    try {
      inserted = asRows(
        await tx.execute(sql`
          insert into cards (season_id, claim_number, slug, product_name, tagline, category,
            website_url, normalized_domain, x_handle, logo_url, accent, founder_email, owner_token,
            claim_ip, is_verified, claim_fee_cents, state)
          values (1, ${co.claim_number}, ${slug}, ${co.product_name}, ${co.tagline}, ${co.category},
            ${co.website_url}, ${co.normalized_domain}, ${co.x_handle}, ${co.logo_url}, ${co.accent}, ${co.founder_email},
            ${co.owner_token}, ${co.claim_ip}, ${co.is_verified}, ${co.fee_cents}, 'live')
          returning id, claim_number, slug
        `),
      );
    } catch (e) {
      // Payment was already captured by the provider but the slot is gone —
      // most likely a duplicate domain or claim number that raced this
      // checkout to fulfillment. Flag it; this needs a manual refund, never a
      // silent drop of captured money.
      await tx
        .update(claimCheckouts)
        .set({ status: "failed", providerOrderId: orderId ?? null })
        .where(eq(claimCheckouts.id, checkoutId));
      throw new Error(
        `claim ${checkoutId} was paid but could not be inserted (needs manual refund review): ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }

    const card = inserted[0];
    await tx
      .update(claimCheckouts)
      .set({
        status: "paid",
        cardId: Number(card.id),
        providerOrderId: orderId ?? null,
        paidAt: new Date(),
      })
      .where(eq(claimCheckouts.id, checkoutId));

    return {
      already: false as const,
      cardId: Number(card.id),
      slug: String(card.slug),
      claimNumber: Number(card.claim_number),
      ownerToken: String(co.owner_token),
      isVerified: Boolean(co.is_verified),
    };
  });
}
