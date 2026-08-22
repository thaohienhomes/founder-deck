/**
 * Claim tiers. The ONLY source of truth for claim-fee amounts.
 * Mirrors lib/packs.ts: the client names a claim number, never a price;
 * the server resolves the fee from where that number falls in the season.
 */
export type ClaimTier = {
  key: "founding" | "early" | "main";
  label: string;
  from: number;
  to: number;
  cents: number;
};

export const SEASON_CAPACITY = 1000;

export const CLAIM_TIERS: ClaimTier[] = [
  { key: "founding", label: "Founding", from: 1, to: 100, cents: 900 },
  { key: "early", label: "Early", from: 101, to: 300, cents: 1900 },
  { key: "main", label: "Main", from: 301, to: 1000, cents: 2900 },
];

export function claimTierForNumber(claimNumber: number): ClaimTier {
  const tier = CLAIM_TIERS.find((t) => claimNumber >= t.from && claimNumber <= t.to);
  if (!tier) throw new Error(`Claim #${claimNumber} is out of season capacity`);
  return tier;
}

export function claimFeeForNumber(claimNumber: number): number {
  return claimTierForNumber(claimNumber).cents;
}

/** Polar product id per claim tier, from env. Set these before going live. */
export function polarProductIdForTier(tierKey: string): string | undefined {
  const key = `POLAR_PRODUCT_CLAIM_${tierKey.toUpperCase()}`;
  return process.env[key];
}
