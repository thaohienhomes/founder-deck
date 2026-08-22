import type { Card } from "./db/schema";

export type Tier = {
  key: string;
  label: string;
  /** tailwind classes for the card frame */
  frame: string;
  chip: string;
};

export const TIERS: Record<string, Tier> = {
  legendary: {
    key: "legendary",
    label: "Legendary",
    frame: "border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_18px_40px_-24px_rgba(251,191,36,0.55)]",
    chip: "bg-amber-400/15 text-amber-700 dark:text-amber-300 border-amber-400/40",
  },
  epic: {
    key: "epic",
    label: "Epic",
    frame: "border-violet-400/60 shadow-[0_0_0_1px_rgba(167,139,250,0.2),0_16px_36px_-26px_rgba(167,139,250,0.5)]",
    chip: "bg-violet-400/15 text-violet-700 dark:text-violet-300 border-violet-400/40",
  },
  rare: {
    key: "rare",
    label: "Rare",
    frame: "border-sky-400/50",
    chip: "bg-sky-400/15 text-sky-700 dark:text-sky-300 border-sky-400/40",
  },
  claimed: {
    key: "claimed",
    label: "Claimed",
    frame: "border-stone-300 dark:border-stone-700",
    chip: "bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-400/30",
  },
};

/**
 * Rarity is a pure function of public, stated rules — never random, never hidden.
 * Rules are printed verbatim on /rules.
 */
export function tierFor(rank: number, boostedCount: number): Tier {
  if (boostedCount === 0) return TIERS.claimed;
  if (rank <= 10) return TIERS.legendary;
  if (rank <= Math.max(1, Math.ceil(boostedCount * 0.1))) return TIERS.epic;
  if (rank <= Math.max(1, Math.ceil(boostedCount * 0.25))) return TIERS.rare;
  return TIERS.claimed;
}

export function isFounding(card: Pick<Card, "claimNumber">) {
  return card.claimNumber <= 100;
}

export function isRising(card: Pick<Card, "lastBoostAt">) {
  if (!card.lastBoostAt) return false;
  return Date.now() - new Date(card.lastBoostAt).getTime() < 24 * 60 * 60 * 1000;
}
