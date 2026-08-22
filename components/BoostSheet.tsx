"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PACKS, fmtUsd } from "@/lib/packs";

type Props = {
  slug: string;
  claimNumber: number;
  rank: number;
  totalBidCents: number;
  ownerToken: string;
  /** cents needed to pass the card directly above; null if already #1 */
  gapToPassCents: number | null;
  onClose: () => void;
};

export function BoostSheet(props: Props) {
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pack = PACKS.find((p) => p.id === picked) ?? null;
  const projected = pack ? props.totalBidCents + pack.cents : props.totalBidCents;
  const passes = pack && props.gapToPassCents !== null && pack.cents > props.gapToPassCents;

  async function go() {
    if (!pack) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/boost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: props.slug, packId: pack.id, k: props.ownerToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout");
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else {
        props.onClose();
        router.push(`/c/${props.slug}?k=${props.ownerToken}&boosted=${data.eventId}`);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={props.onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a boost"
        onClick={(e) => e.stopPropagation()}
        className="rise-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border bg-[var(--bg)] p-5 sm:rounded-2xl hairline"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">
              Boost card #{String(props.claimNumber).padStart(4, "0")}
            </h2>
            <p className="num mt-1 text-[12px] text-[var(--fg2)]">
              Rank #{props.rank} · {fmtUsd(props.totalBidCents)} public bid
            </p>
          </div>
          <button
            onClick={props.onClose}
            aria-label="Close"
            className="grid size-7 shrink-0 place-items-center rounded-md border text-[var(--fg2)] hover:text-[var(--fg)] hairline"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-1.5">
          {PACKS.map((p) => {
            const on = picked === p.id;
            const wouldPass = props.gapToPassCents !== null && p.cents > props.gapToPassCents;
            return (
              <button
                key={p.id}
                onClick={() => setPicked(p.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  on ? "border-amber-500 bg-amber-500/10" : "hover:bg-[var(--bg2)] hairline"
                }`}
              >
                <span className="num w-14 shrink-0 text-[15px] font-medium">+{fmtUsd(p.cents)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">{p.name}</span>
                  <span className="block text-[11px] text-[var(--fg2)]">{p.blurb}</span>
                </span>
                {wouldPass ? (
                  <span className="shrink-0 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Passes #{props.rank - 1}
                  </span>
                ) : p.recommended ? (
                  <span className="shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--fg2)] hairline">
                    Common
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border bg-[var(--bg2)] p-3 text-[12px] leading-relaxed hairline">
          {pack ? (
            <>
              <div className="num text-[13px]">
                {fmtUsd(props.totalBidCents)} → <strong>{fmtUsd(projected)}</strong> total public bid
              </div>
              <div className="mt-0.5 text-[var(--fg2)]">
                {passes
                  ? "This passes the card directly above you. Final rank is calculated after payment — someone else may bid at the same moment."
                  : props.gapToPassCents === null
                    ? "You are already #1. This extends your lead."
                    : `You are ${fmtUsd(props.gapToPassCents)} behind the card above. Final rank is calculated after payment.`}
              </div>
            </>
          ) : (
            <span className="text-[var(--fg2)]">
              Cards rank by total public bid. Your card and profile stay public even if another card
              passes it.
            </span>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-700 dark:text-rose-400">
            {error}
          </p>
        )}

        <button
          disabled={!pack || busy}
          onClick={go}
          className="mt-4 w-full rounded-lg bg-[var(--fg)] px-4 py-2.5 text-[14px] font-medium text-[var(--bg)] transition-opacity disabled:opacity-40"
        >
          {busy ? "Working…" : pack ? `Continue — ${fmtUsd(pack.cents)}` : "Choose a boost"}
        </button>
        <p className="mt-2 text-center text-[11px] text-[var(--fg2)]">
          One-time payment. No subscription, no refund on recorded bids, no resale value.
        </p>
      </div>
    </div>
  );
}
