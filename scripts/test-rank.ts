import { config } from "dotenv";
config({ path: ".env.local" });

import { getDeck, getCardBySlug, applyBoost, packsToOvertake } from "../lib/rank";
import { PACKS } from "../lib/packs";
import { pool } from "../lib/db";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
}

async function main() {
  console.log("\n1. RANK ORDER");
  const deck = await getDeck({ view: "ranked", limit: 200 });
  check("deck is non-empty", deck.length > 50, `got ${deck.length}`);
  let monotone = true, ties = 0;
  for (let i = 1; i < deck.length; i++) {
    const a = deck[i - 1], b = deck[i];
    if (a.rank !== i) monotone = false;
    if (a.totalBidCents < b.totalBidCents) monotone = false;
    if (a.totalBidCents === b.totalBidCents) {
      ties++;
      if (a.bidReachedAt.getTime() > b.bidReachedAt.getTime()) {
        monotone = false;
        console.log(`     tie violation at ${i}: ${a.productName} vs ${b.productName}`);
      }
    }
  }
  check("ranks are 1..n with no gaps and bids never increase down the list", monotone);
  check("seed contains ties to exercise the tie-break", ties > 0, `ties=${ties}`);

  console.log("\n2. TIE-BREAK — later money never passes earlier money");
  // find a tied pair
  const tied = deck.find((c, i) => i > 0 && deck[i - 1].totalBidCents === c.totalBidCents);
  if (tied) {
    const idx = deck.indexOf(tied);
    const higher = deck[idx - 1];
    check(
      `${higher.productName} (#${higher.rank}) reached ${higher.totalBidCents}c before ${tied.productName} (#${tied.rank})`,
      higher.bidReachedAt.getTime() <= tied.bidReachedAt.getTime(),
    );
  } else {
    check("tie pair found", false, "no tie in deck");
  }

  console.log("\n3. BOOST APPLIES CORRECTLY");
  const target = deck[Math.floor(deck.length / 2)];
  const before = await getCardBySlug(target.slug);
  const res = await applyBoost({
    cardId: target.id, packId: "surge", amountCents: 1000,
    checkoutId: `test_${Date.now()}`, orderId: "test",
  });
  const after = await getCardBySlug(target.slug);
  check("total increased by exactly the pack value",
    after!.totalBidCents === before!.totalBidCents + 1000,
    `${before!.totalBidCents} -> ${after!.totalBidCents}`);
  check("rank improved or held", after!.rank <= before!.rank, `#${before!.rank} -> #${after!.rank}`);
  check("event recorded previous/new rank", res.previousRank === before!.rank && res.resultingRank === after!.rank,
    JSON.stringify(res));
  check("bid_reached_at was re-stamped", after!.bidReachedAt.getTime() > before!.bidReachedAt.getTime());

  console.log("\n4. CONCURRENT BOOSTS — no lost updates");
  const victim = deck[10];
  const start = (await getCardBySlug(victim.slug))!.totalBidCents;
  const N = 12;
  await Promise.all(
    Array.from({ length: N }, (_, i) =>
      applyBoost({ cardId: victim.id, packId: "spark", amountCents: 200,
        checkoutId: `race_${Date.now()}_${i}`, orderId: `race_${i}` }),
    ),
  );
  const end = (await getCardBySlug(victim.slug))!.totalBidCents;
  check(`${N} simultaneous $2 boosts all landed`, end === start + N * 200,
    `expected ${start + N * 200}, got ${end}`);

  const { rows: evs } = await pool.query(
    "select count(*)::int n from boost_events where card_id=$1 and pack_id='spark' and order_id like 'race_%'",
    [victim.id],
  );
  check("one immutable history row per boost", Number(evs[0].n) === N, `got ${evs[0].n}`);

  console.log("\n5. OVERTAKE MATH");
  const p = packsToOvertake(300, PACKS);
  check("gap of $3 needs the $5 Push", p.pack.id === "push" && p.count === 1, JSON.stringify(p));
  const p2 = packsToOvertake(12000, PACKS);
  check("gap of $120 needs 3× Takeover", p2.pack.id === "takeover" && p2.count === 3, JSON.stringify(p2));
  const p3 = packsToOvertake(0, PACKS);
  check("gap of $0 needs the cheapest pack", p3.pack.id === "spark", JSON.stringify(p3));

  console.log("\n6. VIEWS");
  for (const v of ["ranked", "new", "rising", "founding", "random"] as const) {
    const d = await getDeck({ view: v, limit: 20 });
    check(`view "${v}" returns cards`, d.length > 0, `got ${d.length}`);
  }
  const search = await getDeck({ view: "ranked", q: "postgres" });
  check("search finds a known card", search.some((c) => c.productName === "Ferrite"),
    search.map((c) => c.productName).join(","));

  console.log(`\n${pass} passed, ${fail} failed\n`);
  await pool.end();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
