import { ImageResponse } from "next/og";
import { getCardBySlug, deckStats } from "@/lib/rank";
import { tierFor } from "@/lib/rarity";
import { usd, claimNo, accentHex, monogram } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1200;
const H = 630;

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const [card, stats] = await Promise.all([getCardBySlug(slug), deckStats()]);

  if (!card) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%", height: "100%", display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "#0b0a09", color: "#f2efe9", fontSize: 40,
          }}
        >
          Card not found
        </div>
      ),
      { width: W, height: H },
    );
  }

  const hex = accentHex(card.accent);
  const tier = tierFor(card.rank, card.totalBidCents > 0 ? stats.boostedCards : 0);
  const showTier = tier.key !== "claimed";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: "#0b0a09", color: "#f2efe9",
          fontFamily: "sans-serif", padding: 56,
        }}
      >
        {/* accent rule */}
        <div style={{ display: "flex", height: 6, width: "100%", background: hex, borderRadius: 3 }} />

        {/* header */}
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            paddingTop: 26, paddingBottom: 26,
            borderBottom: "1px solid #2a2621",
          }}
        >
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 6, color: "#a49d90" }}>
            FOUNDER DECK · SEASON 01
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 600 }}>
            {claimNo(card.claimNumber)}
          </div>
        </div>

        {/* body */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 34, paddingTop: 30 }}>
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 132, height: 132, borderRadius: 26, flexShrink: 0,
              background: `${hex}26`, border: `2px solid ${hex}59`,
              color: hex, fontSize: 50, fontWeight: 700,
            }}
          >
            {monogram(card.productName)}
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", fontSize: 62, fontWeight: 700, letterSpacing: -1.5 }}>
              {card.productName.length > 22
                ? card.productName.slice(0, 21) + "…"
                : card.productName}
            </div>
            <div
              style={{
                display: "flex", fontSize: 27, color: "#a49d90",
                marginTop: 10, lineHeight: 1.35,
              }}
            >
              {card.tagline.length > 78 ? card.tagline.slice(0, 77) + "…" : card.tagline}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <Chip label={card.category.toUpperCase()} color="#a49d90" border="#2a2621" />
              {card.isVerified && <Chip label="VERIFIED" color="#34d399" border="#34d39959" />}
              {card.claimNumber <= 100 && <Chip label="FOUNDING" color="#fbbf24" border="#fbbf2459" />}
              {showTier && (
                <Chip label={tier.label.toUpperCase()} color={hex} border={`${hex}59`} />
              )}
            </div>
          </div>
        </div>

        {/* economics */}
        <div
          style={{
            display: "flex", borderTop: "1px solid #2a2621",
            paddingTop: 26, marginTop: 12, alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 64 }}>
            <Figure label="RANK" value={`#${card.rank}`} color="#f2efe9" />
            <Figure label="TOTAL PUBLIC BID" value={usd(card.totalBidCents)} color={hex} />
          </div>
          <div style={{ display: "flex", fontSize: 21, color: "#6f6a61" }}>
            Every rank is temporary. Every card is permanent.
          </div>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}

function Chip({ label, color, border }: { label: string; color: string; border: string }) {
  return (
    <div
      style={{
        display: "flex", fontSize: 17, letterSpacing: 2, color,
        border: `1px solid ${border}`, borderRadius: 7,
        padding: "6px 12px",
      }}
    >
      {label}
    </div>
  );
}

function Figure({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 17, letterSpacing: 3, color: "#6f6a61" }}>{label}</div>
      <div style={{ display: "flex", fontSize: 58, fontWeight: 700, color, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}
