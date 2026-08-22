# Founder Deck — Merge & Payment Audit Report

_Merged by Hermes (Cowork base + Grok economics). Reviewed 2026-08-22._
_Stack: Next.js + Drizzle + Polar (standardwebhooks). Source of truth for money = signed Polar webhook._

## What came from where
- **Base = Cowork** (`cowork/founderdeck`): full app — webhook route, `lib/rank.ts` row-lock, `lib/claim.ts` advisory-lock + reservation, schema, OG card routes, components, screenshots.
- **Economics reconciled to Grok's numbers** (`grok/founder-deck/DECISION_NOTES.md`): claim tiers + boost packs + rank tie-break.
- **Rejected from Grok:** its hand-rolled HMAC webhook, `POLAR_WEBHOOK_RELAXED` bypass, and `/api/dev/mock-pay` route (all higher payment risk). Not carried over.

## Economics (verified against Grok spec)
| Item | Value | File:line | OK |
|---|---|---|---|
| Boost Spark/Push/Surge/Breakout/Takeover | $2/$5/$10/$25/$50 (cents 200/500/1000/2500/5000) | lib/packs.ts:14-18 | ✅ |
| Claim tiers Founding/Early/Main | $9/$19/$29 at 1-100/101-300/301-1000 | lib/economy.ts:17-19 | ✅ |
| Rank order | total_bid_cents DESC, bid_reached_at ASC, id ASC | lib/rank.ts:11,15 | ✅ |
| Claim fee NOT added to total_bid_cents | separate (claim vs bid) | lib/economy.ts | ✅ |

## Payment safety audit (6 points)
| # | Check | Result | Evidence |
|---|---|---|---|
| a | Webhook verifies signature (standardwebhooks) | ✅ PASS | app/api/webhooks/polar/route.ts:2,38-42 (403 on bad sig) |
| b | Idempotent BEFORE money mutation | ✅ PASS | route.ts:50-57 insert webhookEvents (unique) → dedupe returns before handleOrderPaid:61-62 |
| c | Never trusts browser return URL | ✅ PASS | money only in handleOrderPaid via webhook; success page confirming-only |
| d | Amounts from SERVER config not client | ✅ PASS | claim tier price resolved server-side from reserved claim number (lib/polar.ts:51); packs server-side |
| e | Reservation expiry + release on fail | ✅ PASS | lib/claim.ts:33-46 reserveClaimCheckout, expires_at, only live reservations count |
| f | Double-claim prevented by DB constraint | ✅ PASS | unique(seasonId,claimNumber)+unique(seasonId,normalizedDomain) + pg_advisory_xact_lock (claim.ts:39) |

## Security / secret scan
- ✅ No `.env.local` in merged tree (real secrets NOT shipped).
- ✅ Secret grep (postgres://, polar_*, sk_*) across tree = clean.
- ✅ `.gitignore` blocks `.env*` **and** now whitelists `!.env.example` (so the template ships, real env never does).

## ⚠️ FIXED by Hermes (money-critical)
- **`.env.example` had `SIMULATE_PAYMENTS=1`** → if copied to prod, the whole product gives cards away FREE and collects $0. Changed default to `0` + added a warning comment. **Confirm SIMULATE_PAYMENTS is 0/unset in the Vercel prod env.**

## Before go-live (founder actions)
1. Create Polar products for 5 boost packs + get price IDs → set POLAR_PRODUCT_* env vars.
2. Set POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET (prod), POLAR_SERVER=production, DATABASE_URL (Neon), ADMIN_TOKEN, NEXT_PUBLIC_SITE_URL.
3. Ensure SIMULATE_PAYMENTS=0 (or unset) in prod.
4. Point Polar webhook → /api/webhooks/polar, subscribe order.paid.
5. Run db migrations (drizzle) on the prod DB.
6. Test ONE real $2 Spark boost end-to-end before public launch.

## Not done here
- No git init / push (Hermes pushes after founder OK).
- No real Polar product IDs wired (env only).
- Local typecheck skipped (no node_modules; Vercel/CI will typecheck on deploy).
