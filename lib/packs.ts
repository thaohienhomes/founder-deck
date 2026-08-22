/**
 * Boost packs. The ONLY source of truth for money amounts.
 * The client sends a packId; the server resolves the price. Never the reverse.
 */
export type Pack = {
  id: string;
  name: string;
  cents: number;
  blurb: string;
  recommended?: boolean;
};

export const PACKS: Pack[] = [
  { id: "spark", name: "Spark", cents: 200, blurb: "Get on the board" },
  { id: "push", name: "Push", cents: 500, blurb: "Move a few places", recommended: true },
  { id: "surge", name: "Surge", cents: 1000, blurb: "Real rank movement" },
  { id: "breakout", name: "Breakout", cents: 2500, blurb: "Jump a page" },
  { id: "takeover", name: "Takeover", cents: 5000, blurb: "Come for the top" },
];

export const PACK_BY_ID = new Map(PACKS.map((p) => [p.id, p]));

export function getPack(id: string): Pack | null {
  return PACK_BY_ID.get(id) ?? null;
}

/** Polar product id per pack, from env. Set these before going live. */
export function polarProductId(packId: string): string | undefined {
  const key = `POLAR_PRODUCT_${packId.toUpperCase()}`;
  return process.env[key];
}

export function fmtUsd(cents: number): string {
  if (cents % 100 === 0) return `$${cents / 100}`;
  return `$${(cents / 100).toFixed(2)}`;
}
