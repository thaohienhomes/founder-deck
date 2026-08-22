import { sql, eq, and, desc, gt, isNotNull } from "drizzle-orm";
import { db, cards, boostEvents, boostCheckouts, asRows } from "./db";
import type { Card } from "./db/schema";

export type RankedCard = Card & { rank: number };

export type DeckView = "ranked" | "new" | "rising" | "founding" | "random";

/**
 * THE rule, in one place, stated once:
 *   rank = ORDER BY total_bid_cents DESC, bid_reached_at ASC, id ASC
 * Ties break to whoever reached that total first. `id` is only a determinism
 * backstop for two rows written in the same microsecond.
 */
const RANK_EXPR = sql`row_number() over (order by total_bid_cents desc, bid_reached_at asc, id asc)`;

function rankedCte() {
  return sql`
    select c.*, ${RANK_EXPR} as rank
    from cards c
    where c.state = 'live'
  `;
}

type Row = Record<string, unknown>;

function hydrate(r: Row): RankedCard {
  return {
    id: Number(r.id),
    seasonId: Number(r.season_id),
    claimNumber: Number(r.claim_number),
    slug: String(r.slug),
    productName: String(r.product_name),
    tagline: String(r.tagline),
    category: String(r.category),
    websiteUrl: String(r.website_url),
    normalizedDomain: String(r.normalized_domain),
    xHandle: (r.x_handle as string | null) ?? null,
    logoUrl: (r.logo_url as string | null) ?? null,
    accent: String(r.accent ?? "amber"),
    founderEmail: (r.founder_email as string | null) ?? null,
    ownerToken: String(r.owner_token ?? ""),
    claimIp: (r.claim_ip as string | null) ?? null,
    totalBidCents: Number(r.total_bid_cents),
    bidReachedAt: new Date(r.bid_reached_at as string),
    lastBoostAt: r.last_boost_at ? new Date(r.last_boost_at as string) : null,
    state: String(r.state),
    isVerified: Boolean(r.is_verified),
    claimedAt: new Date(r.claimed_at as string),
    rank: Number(r.rank),
  };
}

export async function deckStats() {
  const [row] = asRows(await db.execute(sql`
    select
      count(*)::int as total_cards,
      count(*) filter (where total_bid_cents > 0)::int as boosted_cards,
      coalesce(sum(total_bid_cents), 0)::int as total_bid_cents
    from cards where state = 'live'
  `));
  const r = row as Row;
  return {
    totalCards: Number(r.total_cards),
    boostedCards: Number(r.boosted_cards),
    totalBidCents: Number(r.total_bid_cents),
  };
}

export async function getDeck(opts: {
  view?: DeckView;
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<RankedCard[]> {
  const { view = "ranked", category, q, limit = 60, offset = 0 } = opts;

  const filters = [sql`true`];
  if (category) filters.push(sql`r.category = ${category}`);
  if (q && q.trim()) {
    const like = `%${q.trim().toLowerCase()}%`;
    filters.push(
      sql`(lower(r.product_name) like ${like} or lower(r.tagline) like ${like} or lower(r.category) like ${like})`,
    );
  }
  if (view === "founding") filters.push(sql`r.claim_number <= 100`);
  if (view === "rising")
    filters.push(sql`r.last_boost_at is not null and r.last_boost_at > now() - interval '24 hours'`);

  const order =
    view === "new"
      ? sql`r.claimed_at desc`
      : view === "rising"
        ? sql`r.last_boost_at desc`
        : view === "founding"
          ? sql`r.claim_number asc`
          : view === "random"
            ? sql`random()`
            : sql`r.rank asc`;

  const rows = await db.execute(sql`
    with r as (${rankedCte()})
    select * from r
    where ${sql.join(filters, sql` and `)}
    order by ${order}
    limit ${limit} offset ${offset}
  `);
  return asRows<Row>(rows).map(hydrate);
}

export async function getCardBySlug(slug: string): Promise<RankedCard | null> {
  const rows = await db.execute(sql`
    with r as (${rankedCte()})
    select * from r where r.slug = ${slug} limit 1
  `);
  const list = asRows<Row>(rows);
  return list.length ? hydrate(list[0]) : null;
}

/** The card directly above this one — the whole point of the challenger panel. */
export async function getCardAbove(rank: number): Promise<RankedCard | null> {
  if (rank <= 1) return null;
  const rows = await db.execute(sql`
    with r as (${rankedCte()})
    select * from r where r.rank = ${rank - 1} limit 1
  `);
  const list = asRows<Row>(rows);
  return list.length ? hydrate(list[0]) : null;
}

export async function getBidHistory(cardId: number, limit = 25) {
  return db
    .select()
    .from(boostEvents)
    .where(eq(boostEvents.cardId, cardId))
    .orderBy(desc(boostEvents.createdAt))
    .limit(limit);
}

export async function recentActivity(limit = 12) {
  const rows = await db.execute(sql`
    select b.*, c.slug, c.product_name, c.claim_number
    from boost_events b join cards c on c.id = b.card_id
    where c.state = 'live'
    order by b.created_at desc limit ${limit}
  `);
  return asRows<Row>(rows).map((r) => ({
    id: Number(r.id),
    slug: String(r.slug),
    productName: String(r.product_name),
    claimNumber: Number(r.claim_number),
    amountCents: Number(r.amount_cents),
    previousRank: r.previous_rank == null ? null : Number(r.previous_rank),
    resultingRank: r.resulting_rank == null ? null : Number(r.resulting_rank),
    createdAt: new Date(r.created_at as string),
  }));
}

export async function categories() {
  const rows = await db.execute(sql`
    select category, count(*)::int as n from cards where state='live'
    group by category order by n desc
  `);
  return asRows<Row>(rows).map((r) => ({
    category: String(r.category),
    n: Number(r.n),
  }));
}

/**
 * Apply a paid boost. Called ONLY from a verified webhook.
 *
 * Everything that can race — reading the old total, writing the new one,
 * stamping bid_reached_at, computing the resulting rank — happens inside one
 * transaction with the card row locked. Two simultaneous boosts serialise;
 * neither can read a stale total.
 */
export async function applyBoost(args: {
  cardId: number;
  packId: string;
  amountCents: number;
  checkoutId?: string;
  orderId?: string;
}) {
  return db.transaction(async (tx) => {
    const locked = await tx.execute(
      sql`select id, total_bid_cents from cards where id = ${args.cardId} for update`,
    );
    const lockedRows = asRows<Row>(locked);
    if (!lockedRows.length) throw new Error(`card ${args.cardId} not found`);
    const previousTotal = Number(lockedRows[0].total_bid_cents);

    // rank BEFORE the write, under the same lock
    const beforeRows = asRows<Row>(
      await tx.execute(sql`
        with r as (${rankedCte()})
        select rank from r where id = ${args.cardId}
      `),
    );
    const previousRank = beforeRows.length ? Number(beforeRows[0].rank) : null;

    const newTotal = previousTotal + args.amountCents;

    await tx.execute(sql`
      update cards
      set total_bid_cents = ${newTotal},
          bid_reached_at = now(),
          last_boost_at = now()
      where id = ${args.cardId}
    `);

    const afterRows = asRows<Row>(
      await tx.execute(sql`
        with r as (${rankedCte()})
        select rank from r where id = ${args.cardId}
      `),
    );
    const resultingRank = afterRows.length ? Number(afterRows[0].rank) : null;

    await tx.insert(boostEvents).values({
      cardId: args.cardId,
      packId: args.packId,
      amountCents: args.amountCents,
      previousTotalCents: previousTotal,
      newTotalCents: newTotal,
      previousRank,
      resultingRank,
      checkoutId: args.checkoutId ?? null,
      orderId: args.orderId ?? null,
    });

    if (args.checkoutId) {
      await tx
        .update(boostCheckouts)
        .set({ status: "paid", paidAt: new Date(), providerOrderId: args.orderId ?? null })
        .where(eq(boostCheckouts.id, args.checkoutId));
    }

    return { previousTotal, newTotal, previousRank, resultingRank };
  });
}

/**
 * Cheapest pack (or packs) that would overtake the card above, padded by
 * $1 so the recommendation clears the gap with room to spare rather than
 * landing on an exact, easily-retaken tie.
 */
export function packsToOvertake(gapCents: number, packs: { id: string; cents: number }[]) {
  const need = gapCents + 100;
  const single = packs.filter((p) => p.cents >= need).sort((a, b) => a.cents - b.cents)[0];
  if (single) return { pack: single, count: 1, spend: single.cents };
  const biggest = packs.reduce((a, b) => (a.cents > b.cents ? a : b));
  const count = Math.ceil(need / biggest.cents);
  return { pack: biggest, count, spend: biggest.cents * count };
}

/** Smallest pack — the standing "defend #1" recommendation when nothing is above you. */
export function smallestPack(packs: { id: string; cents: number }[]) {
  return packs.reduce((a, b) => (a.cents < b.cents ? a : b));
}

export { cards, boostEvents, boostCheckouts, gt, and, eq, isNotNull };
