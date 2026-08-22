# feat/url-only-claim

Simplifies the claim form to a single required field (product URL, plus an
optional email for recovery). Everything else the form used to ask for is now
derived server-side from the URL's Open Graph metadata, with the owner able to
correct or enrich it after payment.

## What changed

- **`lib/og-fetch.ts`** (new) — `fetchOgMeta(url)`, an SSRF-safe scraper.
  Only `http`/`https`; resolves the hostname via DNS and rejects loopback,
  RFC1918 private ranges, link-local (including the `169.254.169.254` cloud
  metadata address), and IPv6 unique-local/loopback. 5s timeout, response
  capped at ~1MB, at most 2 redirects with each hop re-checked for safety.
  Never throws — any failure returns an all-null `OgMeta` so a claim can
  never be blocked by a dead or hostile target site.
  - Known limitation: this checks DNS at request time but doesn't pin the
    connection to the checked IP, so a determined DNS-rebinding attacker
    could in theory still slip past the check between lookup and connect.
    Flagging this as a known gap rather than silently shipping it as "fully
    safe" — worth a follow-up if this endpoint ever becomes higher-value to
    attack (e.g. if it starts writing fetched content somewhere sensitive).
- **`lib/derive-card.ts`** (new) — turns `OgMeta` + the normalized domain into
  `{ productName, tagline, category, logoUrl }` with fallbacks: title →
  site name → domain; description trimmed to 90 chars or empty string;
  category defaults to `"Other"` (added to `lib/categories.ts`); logo is the
  OG image or the site favicon.
- **`app/api/claim/route.ts`** — body is now `{ websiteUrl, email? }` only.
  Runs `looksLive` (unchanged) and `fetchOgMeta` in parallel, derives the
  four fields above, and feeds them into the *unchanged*
  `reserveClaimCheckout` / Polar checkout / webhook path. Domain-uniqueness
  and per-IP rate-limit checks are untouched.
- **`app/api/og-preview/route.ts`** (new) — read-only `GET
  ?url=`, used by the form for a live preview. Never touches the database or
  reserves a claim number; reuses the same SSRF-safe fetch.
- **`components/ClaimForm.tsx`** — down to a URL field and an optional email
  field. Debounces the URL and calls `/api/og-preview` to show a live name /
  tagline / logo preview before submitting.
- **`app/api/card/route.ts`** (new) — `PATCH`, owner-token gated (same
  `owner_token` mechanism `/api/boost` already uses, no new auth). Lets the
  owner set/replace `productName`, `tagline`, `category`, `logoUrl`,
  `xHandle` on their card after claiming.
- **`components/EditSheet.tsx`** (new) + **`components/OwnerPanel.tsx`** —
  "Edit details" button on the owner view opens a sheet that calls the new
  PATCH route.
- **`lib/db/schema.ts`** / **`lib/claim.ts`** — added a nullable `logo_url`
  column to `claim_checkouts` (cards already had one) so the derived logo
  survives from reservation through to `fulfillClaim`'s insert into `cards`.
  Migration generated at `drizzle/0003_fat_doctor_spectrum.sql`
  (`ALTER TABLE claim_checkouts ADD COLUMN logo_url text;`) — **not applied
  to any database**, since no `DATABASE_URL` is configured in this
  environment. Needs `npm run db:push` (or your normal migration flow)
  against a real database before this branch can go live.

## Explicitly unchanged

`normalizeDomain`, `looksLive`, `reserveClaimCheckout`'s locking/numbering
logic, `createClaimCheckout`, and the Polar webhook (`fulfillClaim`'s payment
gating) are untouched — only the values fed into them changed.

## Not done (out of scope for this pass)

- The public card page (`app/c/[slug]/page.tsx`) still renders the monogram
  avatar, not `logoUrl`, even though it's now populated. Wiring that in is a
  small follow-up, left out to keep this change to "what data the claim
  collects and how the card is pre-populated" as scoped.
