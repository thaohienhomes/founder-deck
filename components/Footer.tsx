import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t hairline">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-[12px] text-[var(--fg2)] sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md leading-relaxed">
          Cards rank by total public bid. Your card stays in the deck whatever happens to your rank.
          No guaranteed traffic, no resale value, no chance-based rewards.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link className="hover:text-[var(--fg)]" href="/rules">Rules</Link>
          <Link className="hover:text-[var(--fg)]" href="/cards">Deck</Link>
          <Link className="hover:text-[var(--fg)]" href="/claim">Claim</Link>
        </div>
      </div>
    </footer>
  );
}
