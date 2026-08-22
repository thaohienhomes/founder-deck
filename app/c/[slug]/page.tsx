import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";

import { Nav } from "@/components/Nav";
import { SetupNeeded } from "@/components/SetupNeeded";
import { Footer } from "@/components/Footer";
import { OwnerPanel } from "@/components/OwnerPanel";
import { ShareRow } from "@/components/ShareRow";
import { getCardBySlug, getCardAbove, getBidHistory, deckStats, packsToOvertake } from "@/lib/rank";
import { db, boostEvents, DB_CONFIGURED } from "@/lib/db";
import { tierFor, isFounding, isRising } from "@/lib/rarity";
import { PACKS, fmtUsd } from "@/lib/packs";
import { usd, claimNo, monthYear, ago, accentHex, monogram } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!DB_CONFIGURED) return { title: "Founder Deck" };
  const card = await getCardBySlug(slug);
  if (!card) return { title: "Card not found" };
  const title = `${card.productName} — card ${claimNo(card.claimNumber)}`;
  const description = `${card.tagline} · Rank #${card.rank} · ${usd(card.totalBidCents)} total public bid on Founder Deck.`;
  return {
    title,
    description,
    openGraph: { title, description, images: [`/og/${slug}`] },
    twitter: { card: "summary_large_image", title, description, images: [`/og/${slug}`] },
  };
}

export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string; boosted?: string; claimed?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!DB_CONFIGURED) return <SetupNeeded />;

  const card = await getCardBySlug(slug);
  if (!card) notFound();

  const [above, history, stats] = await Promise.all([
    getCardAbove(card.rank),
    getBidHistory(card.id),
    deckStats(),
  ]);

  const isOwner = Boolean(sp.k && sp.k === card.ownerToken);
  const tier = tierFor(card.rank, card.totalBidCents > 0 ? stats.boostedCards : 0);
  const hex = accentHex(card.accent);
  const gap = above ? above.totalBidCents - card.totalBidCents : null;
  const suggestion =
    gap !== null ? (() => {
      const r = packsToOvertake(gap, PACKS);
      return { label: r.count > 1 ? `${r.count}× ${r.pack.id}` : fmtUsd(r.pack.cents), spend: r.spend };
    })() : null;

  let justBoosted: typeof boostEvents.$inferSelect | null = null;
  if (sp.boosted) {
    const rows = await db
      .select()
      .from(boostEvents)
      .where(eq(boostEvents.id, Number(sp.boosted)))
      .limit(1);
    if (rows.length && rows[0].cardId === card.id) justBoosted = rows[0];
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shareUrl = `${site}/c/${card.slug}`;
  const shareText = `${card.productName} is card ${claimNo(card.claimNumber)} on Founder Deck — rank #${card.rank}, ${usd(card.totalBidCents)} public bid.`;

  return (
    <>
      <Nav stats={stats} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Link href="/cards" className="text-[12px] text-[var(--fg2)] hover:text-[var(--fg)]">
          ← Back to the deck
        </Link>

        {sp.claimed === "1" && isOwner && (
          <div className="rise-in mt-4 rounded-xl border border-amber-500/40 bg-amber-500/[0.08] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
              Card claimed
            </div>
            <div className="num mt-1 text-[24px] font-medium">{claimNo(card.claimNumber)}</div>
            <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-[var(--fg2)]">
              This number is yours for the season. Bookmark this page — the{" "}
              <code className="num">?k=…</code> in the address bar is the key to your card, and it is
              the only copy.
            </p>
            <div className="mt-3">
              <ShareRow url={shareUrl} text={shareText} />
            </div>
          </div>
        )}

        {justBoosted && (
          <div className="rise-in mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.08] p-4">
            {justBoosted.resultingRank &&
            justBoosted.previousRank &&
            justBoosted.resultingRank < justBoosted.previousRank ? (
              <>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                  Rank upgraded
                </div>
                <div className="num mt-1 text-[24px] font-medium">
                  #{justBoosted.previousRank} → #{justBoosted.resultingRank}
                </div>
                <p className="mt-1 text-[13px] text-[var(--fg2)]">
                  You passed {justBoosted.previousRank - justBoosted.resultingRank} card
                  {justBoosted.previousRank - justBoosted.resultingRank === 1 ? "" : "s"}. Total
                  public bid is now {usd(justBoosted.newTotalCents)}.
                </p>
              </>
            ) : (
              <>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                  Boost recorded
                </div>
                <div className="num mt-1 text-[24px] font-medium">
                  {usd(justBoosted.newTotalCents)}
                </div>
                <p className="mt-1 text-[13px] text-[var(--fg2)]">
                  Your total public bid went up but your rank did not move
                  {gap !== null ? ` — you are ${usd(gap)} behind #${card.rank - 1}` : ""}.
                </p>
              </>
            )}
            <div className="mt-3">
              <ShareRow url={shareUrl} text={shareText} />
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* ── the card itself ── */}
          <div>
            <div className={`relative overflow-hidden rounded-2xl border bg-[var(--bg2)] ${tier.frame}`}>
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, ${hex}, ${hex}22)` }}
              />
              <div className="flex items-center justify-between border-b px-6 pt-6 pb-3 hairline">
                <span className="num text-[11px] uppercase tracking-[0.2em] text-[var(--fg2)]">
                  Season 01 · Founder Deck
                </span>
                <span className="num text-[22px] font-medium">{claimNo(card.claimNumber)}</span>
              </div>

              <div className="px-6 py-6">
                <div className="flex items-start gap-4">
                  <span
                    className="num grid size-16 shrink-0 place-items-center rounded-xl text-[22px] font-semibold"
                    style={{ background: `${hex}1f`, color: hex, boxShadow: `inset 0 0 0 1px ${hex}33` }}
                    aria-hidden
                  >
                    {monogram(card.productName)}
                  </span>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight">{card.productName}</h1>
                    <p className="mt-1 text-[15px] leading-snug text-[var(--fg2)]">{card.tagline}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded border px-2 py-0.5 text-[11px] uppercase tracking-[0.1em] text-[var(--fg2)] hairline">
                    {card.category}
                  </span>
                  {card.isVerified && (
                    <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400">
                      Verified
                    </span>
                  )}
                  {isFounding(card) && (
                    <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.1em] text-amber-700 dark:text-amber-400">
                      Founding
                    </span>
                  )}
                  {isRising(card) && (
                    <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400">
                      ▲ Rising
                    </span>
                  )}
                  {tier.key !== "claimed" && (
                    <span className={`rounded border px-2 py-0.5 text-[11px] uppercase tracking-[0.1em] ${tier.chip}`}>
                      {tier.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 border-t hairline sm:grid-cols-4">
                <Stat label="Rank" value={`#${card.rank}`} />
                <Stat label="Total public bid" value={usd(card.totalBidCents)} accent />
                <Stat label="Claim no." value={claimNo(card.claimNumber)} />
                <Stat label="Claimed" value={monthYear(card.claimedAt)} small />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                href={card.websiteUrl}
                target="_blank"
                rel="noreferrer nofollow"
                className="rounded-lg border px-3 py-1.5 text-[12px] text-[var(--fg2)] hover:text-[var(--fg)] hairline"
              >
                Visit {card.normalizedDomain} ↗
              </a>
              {card.xHandle && (
                <a
                  href={`https://x.com/${card.xHandle.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer nofollow"
                  className="rounded-lg border px-3 py-1.5 text-[12px] text-[var(--fg2)] hover:text-[var(--fg)] hairline"
                >
                  {card.xHandle}
                </a>
              )}
              <ShareRow url={shareUrl} text={shareText} />
            </div>
          </div>

          {/* ── the economics ── */}
          <div className="space-y-4">
            {isOwner ? (
              <OwnerPanel
                slug={card.slug}
                claimNumber={card.claimNumber}
                rank={card.rank}
                totalBidCents={card.totalBidCents}
                ownerToken={card.ownerToken}
                gapToPassCents={gap}
                aboveName={above?.productName ?? null}
                suggestion={suggestion}
                productName={card.productName}
                tagline={card.tagline}
                category={card.category}
                logoUrl={card.logoUrl}
                xHandle={card.xHandle}
              />
            ) : above ? (
              <div className="rounded-xl border p-4 hairline">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg2)]">
                  Directly above
                </h2>
                <Link href={`/c/${above.slug}`} className="mt-2 block hover:underline">
                  <span className="num text-[12px] text-[var(--fg2)]">#{above.rank}</span>{" "}
                  <span className="text-[15px] font-medium">{above.productName}</span>
                </Link>
                <p className="mt-1 text-[13px] text-[var(--fg2)]">
                  {usd(above.totalBidCents)} total public bid — {usd(gap ?? 0)} ahead of this card.
                  {suggestion ? ` The ${suggestion.label} boost clears it.` : ""}
                </p>
                <p className="mt-3 text-[12px] text-[var(--fg2)]">
                  Only the owner of a card can boost it.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border p-4 hairline">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg2)]">
                  Top of the deck
                </h2>
                <p className="mt-2 text-[13px] text-[var(--fg2)]">
                  Nothing is above this card right now. Every rank is temporary.
                </p>
              </div>
            )}

            <div className="rounded-xl border p-4 hairline">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg2)]">
                Public bid history
              </h2>
              {history.length === 0 ? (
                <p className="mt-2 text-[13px] text-[var(--fg2)]">
                  No bids yet. This card is claimed and permanent, but not competing for rank.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span className="num text-emerald-600 dark:text-emerald-400">
                        +{usd(h.amountCents)}
                      </span>
                      <span className="num flex-1 text-right text-[var(--fg2)]">
                        {usd(h.previousTotalCents)} → {usd(h.newTotalCents)}
                      </span>
                      <span className="w-16 shrink-0 text-right text-[11px] text-[var(--fg2)]">
                        {ago(h.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border bg-[var(--bg2)] p-4 text-[12px] leading-relaxed text-[var(--fg2)] hairline">
              <strong className="text-[var(--fg)]">Your card stays in the deck.</strong> Rank is the
              part that moves. Cards rank by total public bid; ties go to whoever reached that total
              first.{" "}
              <Link href="/rules" className="underline underline-offset-2 hover:text-[var(--fg)]">
                Read the rules
              </Link>
              .
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="border-r px-5 py-4 last:border-r-0 hairline">
      <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg2)]">{label}</div>
      <div
        className={`num font-medium leading-tight ${small ? "pt-1 text-[15px]" : "text-[24px]"} ${
          accent ? "text-amber-600 dark:text-amber-400" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
