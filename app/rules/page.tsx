import Link from "next/link";
import { Nav } from "@/components/Nav";
import { SetupNeeded } from "@/components/SetupNeeded";
import { DB_CONFIGURED } from "@/lib/db";
import { Footer } from "@/components/Footer";
import { deckStats } from "@/lib/rank";
import { PACKS, fmtUsd } from "@/lib/packs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rules" };

export default async function RulesPage() {
  if (!DB_CONFIGURED) return <SetupNeeded />;
  const stats = await deckStats();

  return (
    <>
      <Nav stats={stats} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Rules</h1>
        <p className="mt-2 text-[15px] text-[var(--fg2)]">
          Every rule that decides where a card sits is on this page. There is no other one.
        </p>

        <Section title="How rank works">
          <p>
            Cards are ordered by <strong>total public bid</strong>, highest first. That is the whole
            algorithm.
          </p>
          <pre className="num mt-3 overflow-x-auto rounded-lg border bg-[var(--bg2)] p-3 text-[12px] hairline">
{`rank = order by total_public_bid desc,
                bid_reached_at asc`}
          </pre>
          <p className="mt-3">
            If two cards have the same total, the one that <em>reached</em> that total first ranks
            higher. Bidding later to match someone never passes them.
          </p>
        </Section>

        <Section title="Claiming">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Claiming a card is free and gives you a permanent claim number for the season.</li>
            <li>One card per domain, per season.</li>
            <li>
              Your card, number, profile, bid history and share image stay public whatever happens
              to your rank. Nothing is ever removed for being outbid.
            </li>
            <li>Claim numbers are issued in order and are never reissued.</li>
          </ul>
        </Section>

        <Section title="Boosting">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Boosting is optional. A card with no boosts is still a real card.</li>
            <li>Only the owner of a card can boost it.</li>
            <li>Boosts come in fixed packs. You cannot type an arbitrary amount.</li>
            <li>Every boost adds its full face value to your total public bid, permanently.</li>
            <li>Bids never decay. There is no maintenance fee and no subscription.</li>
          </ul>
          <div className="mt-3 overflow-hidden rounded-lg border hairline">
            {PACKS.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border-b px-3 py-2 text-[13px] last:border-b-0 hairline"
              >
                <span className="font-medium">{p.name}</span>
                <span className="num text-[var(--fg2)]">
                  costs {fmtUsd(p.cents)} · adds {fmtUsd(p.cents)} to your total
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Status tiers">
          <p>Status is calculated from public numbers. Nothing is random, nothing is bought directly.</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong>Founding</strong> — claim number #0001 to #0100.</li>
            <li><strong>Verified</strong> — the website answered when we checked it.</li>
            <li><strong>Rising</strong> — the card was boosted in the last 24 hours.</li>
            <li><strong>Rare</strong> — currently in the top 25% of bidding cards.</li>
            <li><strong>Epic</strong> — currently in the top 10% of bidding cards.</li>
            <li><strong>Legendary</strong> — currently in the top 10 overall.</li>
          </ul>
          <p className="mt-2">
            Rare, Epic and Legendary are live states. If someone passes you, you lose the frame — but
            never the card.
          </p>
        </Section>

        <Section title="Discovery that rank cannot buy">
          <p>
            The ranked list is one of six views. New arrivals, Rising, Founding set, category decks
            and the random draw all order cards by something other than money, so a card with no
            bids is still findable.
          </p>
        </Section>

        <Section title="What this is not">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Not an investment. Cards and status have no resale or financial value.</li>
            <li>Not gambling. There is no chance, no pack opening, no prize.</li>
            <li>
              Not an ad product. We do not promise traffic, clicks, signups, revenue, SEO benefit or
              investor attention.
            </li>
            <li>Not refundable. A recorded bid is public and permanent.</li>
            <li>
              Not a directory of everything. Cards that are dead links, scams, or abusive get hidden.
            </li>
          </ul>
        </Section>

        <Section title="Season 01">
          <p>
            The season closes when it closes — we will announce a date with at least 14 days notice.
            At close, the standings are frozen into a permanent archive and the top 3 keep a season
            marker on their card. Nothing you bought disappears.
          </p>
        </Section>

        <p className="mt-10 text-[13px] text-[var(--fg2)]">
          Questions before you claim?{" "}
          <Link href="/cards" className="underline underline-offset-2">
            Look at the deck first
          </Link>{" "}
          — it is the honest version of the pitch.
        </p>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9 border-t pt-6 hairline">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--fg2)]">
        {title}
      </h2>
      <div className="mt-3 space-y-2 text-[14px] leading-relaxed">{children}</div>
    </section>
  );
}
