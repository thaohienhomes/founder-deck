import Link from "next/link";
import type { RankedCard } from "@/lib/rank";
import { tierFor, isFounding, isRising } from "@/lib/rarity";
import { usd, claimNo, monthYear, ago, accentHex, monogram } from "@/lib/format";

export function ProductCard({
  card,
  boostedCount,
  compact = false,
}: {
  card: RankedCard;
  boostedCount: number;
  compact?: boolean;
}) {
  const tier = tierFor(card.rank, card.totalBidCents > 0 ? boostedCount : 0);
  const hex = accentHex(card.accent);
  const bidding = card.totalBidCents > 0;
  const founding = isFounding(card);
  const rising = isRising(card);

  const chips = [
    tier.key !== "claimed" && { label: tier.label, cls: tier.chip },
    card.isVerified && {
      label: "Verified",
      cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    founding && {
      label: "Founding",
      cls: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
  ].filter(Boolean).slice(0, 2) as { label: string; cls: string }[];

  return (
    <Link
      href={`/c/${card.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-[var(--bg2)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${tier.frame}`}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${hex}, ${hex}22)` }}
      />

      {/* registry header */}
      <div className="flex items-center justify-between border-b px-4 pt-4 pb-2.5 hairline">
        <span className="num text-[10px] uppercase tracking-[0.18em] text-[var(--fg2)]">
          Season 01
        </span>
        <span className="num text-[15px] font-medium tabular-nums">{claimNo(card.claimNumber)}</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <span
            className="num grid size-11 shrink-0 place-items-center rounded-lg text-[15px] font-semibold"
            style={{ background: `${hex}1f`, color: hex, boxShadow: `inset 0 0 0 1px ${hex}33` }}
            aria-hidden
          >
            {monogram(card.productName)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold tracking-tight">{card.productName}</h3>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[var(--fg2)]">
              {card.tagline}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[var(--fg2)] hairline">
            {card.category}
          </span>
          {/* at most two status chips — the rarest thing about this card, then trust */}
          {chips.map((c) => (
            <span
              key={c.label}
              className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] ${c.cls}`}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* the economics, stated plainly */}
      <div className="grid grid-cols-2 border-t hairline">
        <div className="border-r px-4 py-3 hairline">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg2)]">Rank</div>
          <div className={`num text-[22px] font-medium leading-tight ${bidding ? "" : "text-[var(--fg2)]"}`}>
            #{card.rank}
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg2)]">Public bid</div>
          <div
            className={`num text-[22px] font-medium leading-tight ${
              bidding ? "text-amber-600 dark:text-amber-400" : "text-[var(--fg2)]"
            }`}
          >
            {usd(card.totalBidCents)}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="flex items-center justify-between border-t px-4 py-2 text-[11px] text-[var(--fg2)] hairline">
          {rising ? (
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <span aria-hidden>▲</span> Rising
            </span>
          ) : card.lastBoostAt ? (
            <span>Last bid {ago(card.lastBoostAt)}</span>
          ) : (
            <span>No bid yet</span>
          )}
          <span>Claimed {monthYear(card.claimedAt)}</span>
        </div>
      )}
    </Link>
  );
}
