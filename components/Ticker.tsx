import Link from "next/link";
import { usd, ago } from "@/lib/format";
import type { recentActivity } from "@/lib/rank";

type Item = Awaited<ReturnType<typeof recentActivity>>[number];

export function Ticker({ items }: { items: Item[] }) {
  if (!items.length) return null;
  return (
    <div className="border-y bg-[var(--bg2)] hairline">
      <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-2 text-[12px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it) => {
          const moved =
            it.previousRank != null && it.resultingRank != null && it.resultingRank < it.previousRank;
          return (
            <Link
              key={it.id}
              href={`/c/${it.slug}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[var(--fg2)] hover:text-[var(--fg)]"
            >
              <span aria-hidden className="text-amber-500">▲</span>
              <span className="font-medium text-[var(--fg)]">{it.productName}</span>
              {moved ? (
                <span className="num">
                  #{it.previousRank} → #{it.resultingRank}
                </span>
              ) : (
                <span className="num">+{usd(it.amountCents)}</span>
              )}
              <span className="num opacity-60">{ago(it.createdAt)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
