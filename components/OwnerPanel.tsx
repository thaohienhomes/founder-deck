"use client";

import { useState } from "react";
import { BoostSheet } from "./BoostSheet";
import { fmtUsd } from "@/lib/packs";

export function OwnerPanel(props: {
  slug: string;
  claimNumber: number;
  rank: number;
  totalBidCents: number;
  ownerToken: string;
  gapToPassCents: number | null;
  aboveName: string | null;
  suggestion: { label: string; spend: number } | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.07] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
            Your card
          </h2>
          <span className="num text-[11px] text-[var(--fg2)]">owner view</span>
        </div>

        <p className="mt-3 text-[14px] leading-relaxed">
          Your card is <span className="num font-medium">#{props.rank}</span>.{" "}
          {props.gapToPassCents === null ? (
            <>Nothing is above you.</>
          ) : (
            <>
              <span className="num font-medium">{fmtUsd(props.gapToPassCents)}</span> separates you
              from {props.aboveName ? <strong>{props.aboveName}</strong> : "the card above"} at #
              {props.rank - 1}.
            </>
          )}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg bg-[var(--fg)] px-4 py-2 text-[13px] font-medium text-[var(--bg)]"
          >
            {props.suggestion
              ? `Boost — ${props.suggestion.label} takes the spot`
              : "Boost my card"}
          </button>
          <a
            href={`/c/${props.slug}`}
            className="rounded-lg border px-4 py-2 text-[13px] text-[var(--fg2)] hover:text-[var(--fg)] hairline"
          >
            See public view
          </a>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-[var(--fg2)]">
          Keep this link — it is the key to your card:{" "}
          <code className="num break-all">?k={props.ownerToken}</code>
        </p>
      </div>

      {open && (
        <BoostSheet
          slug={props.slug}
          claimNumber={props.claimNumber}
          rank={props.rank}
          totalBidCents={props.totalBidCents}
          ownerToken={props.ownerToken}
          gapToPassCents={props.gapToPassCents}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
