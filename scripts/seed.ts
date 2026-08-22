import { config } from "dotenv";
config({ path: ".env.local" });
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// [name, tagline, category, domain]
const P: [string,string,string,string][] = [
  ["NovaLens","Turn any screenshot into an editable design file","AI Tools","novalens.app"],
  ["OrbitNote","Meeting notes that write your follow-ups","Productivity","orbitnote.io"],
  ["Quillstack","Ship docs your users actually finish","SaaS","quillstack.com"],
  ["Ferrite","Postgres branching for every pull request","Devtools","ferrite.dev"],
  ["Palettear","Steal any brand's palette in one click","Design","palettear.com"],
  ["Sendgrove","Cold email that survives the spam folder","Marketing","sendgrove.io"],
  ["Tallyhook","Webhooks with a receipt for every retry","Devtools","tallyhook.dev"],
  ["Mintwave","Invoicing for people who hate invoicing","Fintech","mintwave.co"],
  ["Clipforge","Long video in, ten shorts out","Creator","clipforge.app"],
  ["Verdant","Habit tracking that forgives a bad week","Health","verdant.day"],
  ["Kernelly","One dashboard for every model you run","AI Tools","kernelly.ai"],
  ["Slatepad","Whiteboards that export to real code","Design","slatepad.io"],
  ["Runchart","Analytics without the tag manager","Analytics","runchart.com"],
  ["Pocketlist","Read-it-later that reads it for you","Productivity","pocketlist.app"],
  ["Brambleworks","Landing pages from a single sentence","Marketing","brambleworks.com"],
  ["Deployyard","Preview environments that cost nothing idle","Devtools","deployyard.dev"],
  ["Loomstack","Customer interviews, auto-synthesised","SaaS","loomstack.io"],
  ["Cardinal Draft","Contracts a founder can read","SaaS","cardinaldraft.com"],
  ["Fathomly","Churn signals two weeks early","Analytics","fathomly.io"],
  ["Threadneedle","Turn your changelog into a thread","Creator","threadneedle.app"],
  ["Gravitas UI","Component library with opinions","Design","gravitas.design"],
  ["Sablefin","Runway maths for solo founders","Fintech","sablefin.com"],
  ["Echostash","Voice notes that become tickets","Productivity","echostash.io"],
  ["Prismatic Labs","A/B tests without a data team","Analytics","prismaticlabs.co"],
  ["Hearthwork","Onboarding flows you can edit live","SaaS","hearthwork.com"],
  ["Bytemarsh","Log search that stays under $10","Devtools","bytemarsh.dev"],
  ["Vellumine","PDF forms that fill themselves","AI Tools","vellumine.com"],
  ["Coldbrew CRM","A CRM that fits on one screen","SaaS","coldbrewcrm.com"],
  ["Stagelight","Demo videos, no editing","Creator","stagelight.video"],
  ["Nutshelf","Every subscription you forgot about","Fintech","nutshelf.app"],
  ["Ardentry","Job posts that don't sound like job posts","Marketing","ardentry.com"],
  ["Foxglove Kit","Icons drawn for dark mode first","Design","foxglove.kit"],
  ["Tempolane","Sprint planning in fifteen minutes","Productivity","tempolane.io"],
  ["Sonarpage","SEO briefs your writers won't ignore","Marketing","sonarpage.com"],
  ["Ironbark","Rate limiting as a single import","Devtools","ironbark.dev"],
  ["Milkroute","Deliveries for tiny food businesses","SaaS","milkroute.co"],
  ["Glasswing","Uptime pages people trust","Devtools","glasswing.status"],
  ["Petrichor","Journaling with a memory","Health","petrichor.day"],
  ["Reelbank","Stock footage priced like software","Creator","reelbank.com"],
  ["Cobblemint","Invoices in fourteen currencies","Fintech","cobblemint.com"],
  ["Wavelet","Podcast clips for people who hate editing","Creator","wavelet.fm"],
  ["Duskform","Forms that don't look like forms","Design","duskform.com"],
  ["Halcyon Sheets","Spreadsheets that explain themselves","Productivity","halcyonsheets.com"],
  ["Tinderbox AI","Prompt versioning for real teams","AI Tools","tinderbox.ai"],
  ["Marrowlink","Internal links, found automatically","Marketing","marrowlink.com"],
  ["Stonecrop","Static hosting with real logs","Devtools","stonecrop.host"],
  ["Bellhaven","Booking pages for small clinics","Health","bellhaven.care"],
  ["Auroralite","Dark mode for any website, properly","Design","auroralite.com"],
  ["Kettleblack","Expense receipts, photographed and gone","Fintech","kettleblack.app"],
  ["Nightjar","Error tracking that stays quiet","Devtools","nightjar.dev"],
  ["Sagewrap","Wrap any API in a typed SDK","Devtools","sagewrap.dev"],
  ["Plumbline","Pricing pages that convert on mobile","Marketing","plumbline.co"],
  ["Ochreboard","Kanban that hides done columns","Productivity","ochreboard.com"],
  ["Fernwell","Plant care, actually followed","Health","fernwell.app"],
  ["Copperfeed","RSS for people who left Twitter","Creator","copperfeed.com"],
  ["Maplewright","Docs site in one markdown folder","Devtools","maplewright.dev"],
  ["Zephyrbase","Vector search without the cluster","AI Tools","zephyrbase.ai"],
  ["Tallowmoon","Newsletter sponsorships, matched","Marketing","tallowmoon.com"],
  ["Grainstore","Backups you can actually restore","Devtools","grainstore.io"],
  ["Lanternfish","Support inbox for two-person teams","SaaS","lanternfish.support"],
  ["Beacontide","Push notifications people don't mute","SaaS","beacontide.com"],
  ["Cindershop","Storefronts for one product","SaaS","cindershop.co"],
  ["Vireo","Accessibility checks in your editor","Devtools","vireo.a11y"],
  ["Saltmarsh","Community forum without the bloat","SaaS","saltmarsh.community"],
  ["Roseglass","Screenshots that look expensive","Design","roseglass.app"],
  ["Amberdock","Ship notes to your users, not a changelog","Marketing","amberdock.com"],
  ["Thistlebyte","Cron jobs with an audit trail","Devtools","thistlebyte.dev"],
  ["Wickerly","Interview scheduling that respects time zones","Productivity","wickerly.com"],
  ["Glimmerpath","Learning paths from your own docs","AI Tools","glimmerpath.ai"],
  ["Redkite","Ad creative testing for tiny budgets","Marketing","redkite.ads"],
  ["Umberline","Design tokens that survive handoff","Design","umberline.design"],
  ["Sparrowdesk","Helpdesk macros that write themselves","AI Tools","sparrowdesk.ai"],
  ["Flintmarket","Buy and sell side projects","Fintech","flintmarket.com"],
  ["Larkspur","Standups without a meeting","Productivity","larkspur.team"],
  ["Basalt Forms","Surveys with an honest response rate","Analytics","basaltforms.com"],
  ["Novemgrid","Dashboards from a SQL file","Analytics","novemgrid.com"],
  ["Willowbank","Savings goals for freelancers","Fintech","willowbank.money"],
  ["Chalkstream","Course hosting minus the platform fee","Creator","chalkstream.com"],
  ["Bramblewick","Recipe scaling for real kitchens","Health","bramblewick.app"],
  ["Oxidian","Rust playground with your crates","Devtools","oxidian.dev"],
  ["Featherpost","Transactional email under a dollar","Devtools","featherpost.email"],
  ["Cloudberry","Image CDN with sane defaults","Devtools","cloudberry.cdn"],
  ["Moorstone","Legal templates for indie SaaS","SaaS","moorstone.legal"],
  ["Tideglass","Session replay that respects privacy","Analytics","tideglass.io"],
  ["Ravenshade","Dark patterns detector for your own funnel","Analytics","ravenshade.com"],
  ["Bellwether","Competitor pricing, watched","Marketing","bellwether.watch"],
  ["Juniperloop","Referral programs in an afternoon","Marketing","juniperloop.com"],
  ["Emberwick","Status updates your investors read","SaaS","emberwick.co"],
  ["Silvermoss","Photo backup you own","Productivity","silvermoss.photo"],
  ["Kindlewood","Reading lists for engineering teams","Productivity","kindlewood.dev"],
  ["Hollowpine","Sleep tracking without a wearable","Health","hollowpine.sleep"],
  ["Verglas","Type-safe env vars, enforced","Devtools","verglas.dev"],
  ["Sunderline","Split tests for pricing pages","Analytics","sunderline.com"],
  ["Marlowe AI","Agents that stop when they're unsure","AI Tools","marlowe.ai"],
  ["Pitchfern","Investor updates that write themselves","AI Tools","pitchfern.ai"],
  ["Cragmoor","Map tiles for indie apps","Devtools","cragmoor.maps"],
  ["Tinsmith","Firmware OTA for hobby hardware","Devtools","tinsmith.io"],
];

const ACCENTS = ["amber","violet","sky","emerald","rose"];

// deterministic pseudo-random so re-seeding gives the same board
let s = 20260820;
const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const between = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));

const slugify = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Long-tail bid distribution from the PRD, in cents. */
function bidFor(i: number, n: number): number {
  const pct = i / n;
  if (pct < 0.28) return 0;                              // 28% : claimed, never boosted
  if (pct < 0.40) return between(1, 10) * 100;           // 12% : $1-10
  if (pct < 0.75) return between(11, 50) * 100;         // 35% : $11-50
  if (pct < 0.95) return between(51, 200) * 100;        // 20% : $51-200
  return between(201, 640) * 100;                        //  5% : $200+
}

async function main() {
  await pool.query("truncate table cards, boost_events, boost_checkouts, webhook_events restart identity");

  const n = P.length;
  const order = P.map((_, i) => i).sort(() => rnd() - 0.5);

  const now = Date.now();
  type SeedRow = {
    claimNumber: number; slug: string; productName: string; tagline: string;
    category: string; websiteUrl: string; normalizedDomain: string;
    xHandle: string | null; accent: string; ownerToken: string;
    totalBidCents: number; bidReachedAt: Date; lastBoostAt: Date | null;
    claimedAt: Date; isVerified: boolean;
  };
  const rows: SeedRow[] = [];

  order.forEach((pi, idx) => {
    const [name, tagline, category, domain] = P[pi];
    let cents = bidFor(idx, n);

    // deliberate ties, to exercise the tie-break rule
    if (idx === 12 || idx === 13) cents = 5000;
    if (idx === 30 || idx === 31 || idx === 32) cents = 2500;

    const claimNumber = idx + 1;
    // earlier claim numbers were claimed earlier
    // spread claims across ~24 days so "Rising" and "New" mean something
    const claimedAt = new Date(now - (n - idx) * 6.2 * 3600 * 1000 - between(0, 5400) * 1000);
    // a card that has boosted reached its total some time after claiming
    const boosted = cents > 0;
    const lastBoostAt = boosted
      ? new Date(claimedAt.getTime() + between(20, 2200) * 60 * 1000)
      : null;
    const bidReachedAt = lastBoostAt ?? claimedAt;

    rows.push({
      claimNumber, slug: slugify(name), productName: name, tagline, category,
      websiteUrl: `https://${domain}`, normalizedDomain: domain,
      xHandle: rnd() > 0.45 ? `@${slugify(name).replace(/-/g, "")}` : null,
      accent: pick(ACCENTS),
      ownerToken: `seed_${slugify(name)}`,
      totalBidCents: cents,
      bidReachedAt, lastBoostAt, claimedAt,
      isVerified: rnd() > 0.62,
    });
  });

  // push most boost activity into the past, then let exactly 11 cards be "Rising"
  for (const r of rows) {
    if (!r.lastBoostAt) continue;
    r.lastBoostAt = new Date(r.claimedAt.getTime() + between(30, 7 * 24 * 60) * 60 * 1000);
    if (r.lastBoostAt.getTime() > now - 26 * 3600 * 1000) {
      r.lastBoostAt = new Date(now - between(27, 400) * 3600 * 1000);
    }
    r.bidReachedAt = r.lastBoostAt;
  }
  const risingIdx = rows
    .map((_, i) => i)
    .filter((i) => rows[i].totalBidCents > 0)
    .sort(() => rnd() - 0.5)
    .slice(0, 11);
  for (const i of risingIdx) {
    rows[i].lastBoostAt = new Date(now - between(6, 1350) * 60 * 1000);
    rows[i].bidReachedAt = rows[i].lastBoostAt;
  }

  for (const r of rows) {
    await pool.query(
      `insert into cards (claim_number, slug, product_name, tagline, category, website_url,
        normalized_domain, x_handle, accent, owner_token, total_bid_cents, bid_reached_at,
        last_boost_at, claimed_at, is_verified)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [r.claimNumber, r.slug, r.productName, r.tagline, r.category, r.websiteUrl,
       r.normalizedDomain, r.xHandle, r.accent, r.ownerToken, r.totalBidCents,
       r.bidReachedAt, r.lastBoostAt, r.claimedAt, r.isVerified],
    );
  }

  // synthesise plausible bid history for boosted cards
  const PACKS = [["spark",200],["push",500],["surge",1000],["breakout",2500],["takeover",5000]] as const;
  const { rows: live } = await pool.query(
    "select id, total_bid_cents, claimed_at, last_boost_at from cards where total_bid_cents > 0",
  );
  for (const c of live) {
    // decide the boosts first, then lay them on a strictly increasing timeline
    // that starts after the claim and ends exactly at last_boost_at
    const steps: [string, number][] = [];
    let remaining = Number(c.total_bid_cents);
    let guard = 0;
    while (remaining > 0 && guard++ < 24) {
      const affordable = PACKS.filter(([, v]) => v <= remaining);
      const [packId, v] = affordable.length
        ? affordable[Math.floor(rnd() * affordable.length)]
        : PACKS[0];
      const amt = Math.min(v, remaining);
      steps.push([packId, amt]);
      remaining -= amt;
    }
    const t0 = new Date(c.claimed_at).getTime() + 12 * 60 * 1000;
    const t1 = new Date(c.last_boost_at).getTime();
    const span = Math.max(t1 - t0, steps.length * 60_000);
    let running = 0;
    for (let i = 0; i < steps.length; i++) {
      const [packId, amt] = steps[i];
      const prev = running;
      running += amt;
      // last event lands exactly on last_boost_at so the card page agrees with the deck
      const at = i === steps.length - 1 ? t1 : t0 + Math.round((span * (i + 1)) / (steps.length + 1));
      await pool.query(
        `insert into boost_events (card_id, pack_id, amount_cents, previous_total_cents, new_total_cents, created_at)
         values ($1,$2,$3,$4,$5,$6)`,
        [c.id, packId, amt, prev, running, new Date(at)],
      );
    }
  }

  const { rows: stat } = await pool.query(
    `select count(*)::int total, count(*) filter (where total_bid_cents>0)::int boosted,
            sum(total_bid_cents)::int sum from cards`,
  );
  console.log("seeded:", stat[0]);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
