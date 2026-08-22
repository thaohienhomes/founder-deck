import { Nav } from "@/components/Nav";
import { SetupNeeded } from "@/components/SetupNeeded";
import { DB_CONFIGURED } from "@/lib/db";
import { Footer } from "@/components/Footer";
import { DeckToolbar } from "@/components/DeckToolbar";
import { ProductCard } from "@/components/ProductCard";
import { getDeck, deckStats, categories, type DeckView } from "@/lib/rank";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "The deck" };

const ALLOWED: DeckView[] = ["ranked", "new", "rising", "founding", "random"];

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  if (!DB_CONFIGURED) return <SetupNeeded />;
  const view = (ALLOWED.includes(sp.view as DeckView) ? sp.view : "ranked") as DeckView;

  const [stats, cats, deck] = await Promise.all([
    deckStats(),
    categories(),
    getDeck({ view, q: sp.q, category: sp.category, limit: 96 }),
  ]);

  return (
    <>
      <Nav stats={stats} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">The deck</h1>
            <p className="mt-1 text-[13px] text-[var(--fg2)]">
              {stats.totalCards} cards claimed · {stats.boostedCards} bidding · every card stays,
              whatever the rank does.
            </p>
          </div>
        </div>

        <DeckToolbar view={view} q={sp.q} category={sp.category} cats={cats} />

        {deck.length === 0 ? (
          <div className="mt-16 rounded-xl border border-dashed py-16 text-center hairline">
            <p className="text-[15px] font-medium">Nothing in this view yet.</p>
            <p className="mt-1 text-[13px] text-[var(--fg2)]">
              Try another view, or{" "}
              <Link href="/claim" className="underline underline-offset-2">
                claim a card
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {deck.map((c) => (
              <ProductCard key={c.id} card={c} boostedCount={stats.boostedCards} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
