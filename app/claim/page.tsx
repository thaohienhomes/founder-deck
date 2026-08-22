import { sql } from "drizzle-orm";
import { Nav } from "@/components/Nav";
import { SetupNeeded } from "@/components/SetupNeeded";
import { Footer } from "@/components/Footer";
import { ClaimForm } from "@/components/ClaimForm";
import { db, asRows, DB_CONFIGURED } from "@/lib/db";
import { deckStats } from "@/lib/rank";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Claim a card",
  description: "Claim a permanent product card in Season 01 of Founder Deck. Free.",
};

export default async function ClaimPage() {
  if (!DB_CONFIGURED) return <SetupNeeded />;
  const [stats, next] = await Promise.all([
    deckStats(),
    db.execute(sql`select coalesce(max(claim_number),0)+1 as n from cards where season_id = 1`),
  ]);
  const nextNumber = Number(asRows(next)[0].n);

  return (
    <>
      <Nav stats={stats} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight">Claim your product card</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--fg2)]">
            One card per product, one number per card, permanent for the season. Claiming costs
            nothing — the competition for rank is the part you pay for, and only if you want to.
          </p>
        </div>
        <div className="mt-8">
          <ClaimForm nextNumber={nextNumber} />
        </div>
      </main>
      <Footer />
    </>
  );
}
