import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { usd } from "@/lib/format";

export function Nav({
  stats,
}: {
  stats: { totalCards: number; boostedCards: number; totalBidCents: number };
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-[var(--bg)]/85 backdrop-blur-md hairline">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="text-[15px] font-semibold tracking-tight">Founder Deck</span>
          <span className="num hidden text-[10px] uppercase tracking-[0.18em] text-[var(--fg2)] sm:inline">
            S01
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-[13px] text-[var(--fg2)] md:flex">
          <Link className="rounded px-2 py-1 hover:text-[var(--fg)]" href="/cards">Deck</Link>
          <Link className="rounded px-2 py-1 hover:text-[var(--fg)]" href="/cards?view=new">New</Link>
          <Link className="rounded px-2 py-1 hover:text-[var(--fg)]" href="/cards?view=rising">Rising</Link>
          <Link className="rounded px-2 py-1 hover:text-[var(--fg)]" href="/cards?view=random">Random draw</Link>
          <Link className="rounded px-2 py-1 hover:text-[var(--fg)]" href="/rules">Rules</Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="num hidden text-[11px] text-[var(--fg2)] lg:inline">
            {stats.totalCards.toLocaleString()} cards · {usd(stats.totalBidCents)} in public bids
          </span>
          <ThemeToggle />
          <Link
            href="/claim"
            className="rounded-md bg-[var(--fg)] px-3 py-1.5 text-[13px] font-medium text-[var(--bg)] transition-opacity hover:opacity-90"
          >
            Claim a card
          </Link>
        </div>
      </div>
    </header>
  );
}
