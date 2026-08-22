import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * cards — the durable asset. A card NEVER leaves the deck.
 * Rank is derived (total_bid_cents DESC, bid_reached_at ASC), never stored as truth.
 */
export const cards = pgTable(
  "cards",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id").notNull().default(1),
    claimNumber: integer("claim_number").notNull(),
    slug: text("slug").notNull(),

    productName: text("product_name").notNull(),
    tagline: text("tagline").notNull(),
    category: text("category").notNull(),
    websiteUrl: text("website_url").notNull(),
    normalizedDomain: text("normalized_domain").notNull(),
    xHandle: text("x_handle"),
    logoUrl: text("logo_url"),
    accent: text("accent").notNull().default("amber"),

    founderEmail: text("founder_email"),
    ownerToken: text("owner_token").notNull(),
    claimIp: text("claim_ip"),

    // economics — cents everywhere, never floats
    claimFeeCents: integer("claim_fee_cents").notNull().default(0),
    totalBidCents: integer("total_bid_cents").notNull().default(0),
    bidReachedAt: timestamp("bid_reached_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastBoostAt: timestamp("last_boost_at", { withTimezone: true }),

    state: text("state").notNull().default("live"), // live | hidden | flagged
    isVerified: boolean("is_verified").notNull().default(false),

    claimedAt: timestamp("claimed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("cards_slug_uq").on(t.slug),
    uniqueIndex("cards_claim_number_uq").on(t.seasonId, t.claimNumber),
    uniqueIndex("cards_domain_uq").on(t.seasonId, t.normalizedDomain),
    // the ranking index — exactly matches ORDER BY total_bid DESC, bid_reached_at ASC
    index("cards_rank_idx").on(t.totalBidCents.desc(), t.bidReachedAt.asc()),
    index("cards_claimed_idx").on(t.claimedAt.desc()),
    index("cards_boost_idx").on(t.lastBoostAt.desc()),
    index("cards_claim_ip_idx").on(t.claimIp, t.claimedAt.desc()),
  ],
);

/**
 * boost_events — immutable public bid history. Append only.
 */
export const boostEvents = pgTable(
  "boost_events",
  {
    id: serial("id").primaryKey(),
    cardId: integer("card_id").notNull(),
    packId: text("pack_id").notNull(),
    amountCents: integer("amount_cents").notNull(),
    previousTotalCents: integer("previous_total_cents").notNull(),
    newTotalCents: integer("new_total_cents").notNull(),
    previousRank: integer("previous_rank"),
    resultingRank: integer("resulting_rank"),
    checkoutId: text("checkout_id"),
    orderId: text("order_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("boost_card_idx").on(t.cardId, t.createdAt.desc()),
    index("boost_created_idx").on(t.createdAt.desc()),
  ],
);

/**
 * boost_checkouts — server-created intent. The client never names a price.
 */
export const boostCheckouts = pgTable(
  "boost_checkouts",
  {
    id: text("id").primaryKey(),
    cardId: integer("card_id").notNull(),
    packId: text("pack_id").notNull(),
    amountCents: integer("amount_cents").notNull(),
    provider: text("provider").notNull().default("polar"),
    providerCheckoutId: text("provider_checkout_id"),
    providerOrderId: text("provider_order_id"),
    status: text("status").notNull().default("pending"), // pending | paid | expired | failed
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [index("checkout_card_idx").on(t.cardId)],
);

/**
 * claim_checkouts — server-created claim intent, paid pre-fulfillment.
 * No row lands in `cards` (and no claim number becomes permanent) until the
 * webhook confirms payment — see fulfillClaim() in lib/claim.ts.
 */
export const claimCheckouts = pgTable(
  "claim_checkouts",
  {
    id: text("id").primaryKey(),
    claimNumber: integer("claim_number").notNull(),
    tier: text("tier").notNull(), // founding | early | main
    feeCents: integer("fee_cents").notNull(),

    productName: text("product_name").notNull(),
    tagline: text("tagline").notNull(),
    category: text("category").notNull(),
    websiteUrl: text("website_url").notNull(),
    normalizedDomain: text("normalized_domain").notNull(),
    xHandle: text("x_handle"),
    logoUrl: text("logo_url"),
    founderEmail: text("founder_email"),
    accent: text("accent").notNull().default("amber"),
    ownerToken: text("owner_token").notNull(),
    claimIp: text("claim_ip"),
    isVerified: boolean("is_verified").notNull().default(false),

    provider: text("provider").notNull().default("polar"),
    providerCheckoutId: text("provider_checkout_id"),
    providerOrderId: text("provider_order_id"),
    status: text("status").notNull().default("pending"), // pending | paid | expired | failed
    cardId: integer("card_id"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [
    index("claim_checkout_status_idx").on(t.status, t.createdAt.desc()),
    index("claim_checkout_domain_idx").on(t.normalizedDomain),
  ],
);

/**
 * webhook_events — idempotency ledger. One row per provider event id, ever.
 */
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").notNull().default("polar"),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processingError: text("processing_error"),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("webhook_event_uq").on(t.provider, t.providerEventId)],
);

export type Card = typeof cards.$inferSelect;
export type BoostEvent = typeof boostEvents.$inferSelect;
export type ClaimCheckout = typeof claimCheckouts.$inferSelect;
