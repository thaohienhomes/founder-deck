import Link from "next/link";
import { Nav } from "@/components/Nav";
import { SetupNeeded } from "@/components/SetupNeeded";
import { DB_CONFIGURED } from "@/lib/db";
import { Footer } from "@/components/Footer";
import { Ticker } from "@/components/Ticker";
import { ProductCard } from "@/components/ProductCard";
import { deckStats, getDeck, recentActivity } from "@/lib/rank";
import { usd } from "@/lib/format";
import { PACKS, fmtUsd } from "@/lib/packs";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!DB_CONFIGURED) return <SetupNeeded />;
  const [stats, top, fresh, activity] = await Promise.all([
    deckStats(),
    getDeck({ view: "ranked", limit: 8 }),
    getDeck({ view: "new", limit: 4 }),
    recentActivity(10),
  ]);

  return (
    <>
      <Nav stats={stats} />
      <Ticker items={activity} />

      <main className="flex-1">
        {/* hero */}
        <section className="relative overflow-hidden border-b hairline">
          <div aria-hidden className="registry-bg pointer-events-none absolute inset-0" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <p className="num text-[11px] uppercase tracking-[0.24em] text-[var(--fg2)]">
              Season 01 · open
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              Claim your product card.
              <br />
              <span className="text-[var(--fg2)]">Build its legend.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[var(--fg2)]">
              A collectible board where every product gets one permanent card and one permanent
              number. Cards rank by total public bid — anyone can be overtaken, nobody gets removed.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/claim"
                className="rounded-lg bg-[var(--fg)] px-5 py-2.5 text-[14px] font-medium text-[var(--bg)] transition-opacity hover:opacity-90"
              >
                Claim a card — free
              </Link>
              <Link
                href="/cards"
                className="rounded-lg border px-5 py-2.5 text-[14px] transition-colors hover:bg-[var(--bg2)] hairline"
              >
                Browse the deck
              </Link>
            </div>

            <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-xl border bg-[var(--rule)] hairline">
              <Metric label="Cards claimed" value={stats.totalCards.toLocaleString()} />
              <Metric label="In public bids" value={usd(stats.totalBidCents)} />
              <Metric label="Cards bidding" value={stats.boostedCards.toLocaleString()} />
            </dl>
          </div>
        </section>

        {/* the rule, stated once, plainly */}
        <section className="border-b hairline">
          <div className="mx-auto grid max-w-6xl gap-px bg-[var(--rule)] px-0 sm:grid-cols-3">
            <Step
              n="01"
              title="Claim a card"
              body="Free, one per product. You get a permanent claim number, a public profile and a share image — whether or not you ever bid."
            />
            <Step
              n="02"
              title="Boost to rank"
              body={`Fixed packs from ${fmtUsd(PACKS[0].cents)} to ${fmtUsd(PACKS[PACKS.length - 1].cents)}. Your total public bid is your rank. No hidden algorithm, no auction sniping.`}
            />
            <Step
              n="03"
              title="Get overtaken"
              body="Someone will outbid you eventually. Your card, number, profile and history all stay exactly where they are. Only the rank moves."
            />
          </div>
        </section>

        {/* top of the deck */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Top of the deck</h2>
              <p className="mt-1 text-[13px] text-[var(--fg2)]">
                Ranked by total public bid. Ties go to whoever got there first.
              </p>
            </div>
            <Link href="/cards" className="shrink-0 text-[13px] text-[var(--fg2)] hover:text-[var(--fg)]">
              All cards →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {top.map((c) => (
              <ProductCard key={c.id} card={c} boostedCount={stats.boostedCards} />
            ))}
          </div>
        </section>

        {/* new arrivals — the discovery slot that rank cannot buy */}
        <section className="border-t hairline">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Just claimed</h2>
                <p className="mt-1 text-[13px] text-[var(--fg2)]">
                  Newest cards on the board. This row is never for sale.
                </p>
              </div>
              <Link
                href="/cards?view=new"
                className="shrink-0 text-[13px] text-[var(--fg2)] hover:text-[var(--fg)]"
              >
                More →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fresh.map((c) => (
                <ProductCard key={c.id} card={c} boostedCount={stats.boostedCards} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t hairline">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Card #{String(stats.totalCards + 1).padStart(4, "0")} is unclaimed.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-[var(--fg2)]">
              Claim numbers are handed out in order and never reissued. The lower yours is, the
              earlier you were.
            </p>
            <Link
              href="/claim"
              className="mt-6 inline-block rounded-lg bg-[var(--fg)] px-5 py-2.5 text-[14px] font-medium text-[var(--bg)]"
            >
              Take it
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--bg)] px-3 py-3.5 sm:px-5 sm:py-4">
      <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--fg2)] sm:text-[11px]">
        {label}
      </dt>
      <dd className="num mt-1 text-[19px] font-medium sm:text-[24px]">{value}</dd>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-[var(--bg)] px-4 py-8 sm:px-6">
      <span className="num text-[11px] tracking-[0.2em] text-amber-500">{n}</span>
      <h3 className="mt-2 text-[16px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--fg2)]">{body}</p>
    </div>
  );
}
