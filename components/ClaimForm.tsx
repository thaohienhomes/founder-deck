"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { accentHex, monogram } from "@/lib/format";

const CATEGORIES = [
  "AI Tools", "Devtools", "SaaS", "Design", "Marketing",
  "Productivity", "Creator", "Fintech", "Analytics", "Health",
];

export function ClaimForm({ nextNumber }: { nextNumber: number }) {
  const router = useRouter();
  const [f, setF] = useState({
    productName: "",
    tagline: "",
    category: "AI Tools",
    websiteUrl: "",
    xHandle: "",
    email: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dupSlug, setDupSlug] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDupSlug(null);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) {
        setDupSlug(data.slug ?? null);
        throw new Error(data.error ?? "Could not claim");
      }
      try {
        const saved = JSON.parse(localStorage.getItem("fd-cards") ?? "[]");
        saved.push({ slug: data.slug, k: data.ownerToken, n: data.claimNumber });
        localStorage.setItem("fd-cards", JSON.stringify(saved));
      } catch {}
      router.push(`/c/${data.slug}?k=${data.ownerToken}&claimed=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  const name = f.productName || "Your product";
  const tagline = f.tagline || "One line about what it does";
  const hex = accentHex("amber");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Product name" hint="Shown large on the card">
          <input
            required maxLength={40} value={f.productName} onChange={set("productName")}
            placeholder="NovaLens"
            className="w-full rounded-lg border bg-[var(--bg2)] px-3 py-2 text-[14px] outline-none focus:border-amber-500 hairline"
          />
        </Field>

        <Field label="One-line pitch" hint={`${f.tagline.length}/90`}>
          <input
            required minLength={8} maxLength={90} value={f.tagline} onChange={set("tagline")}
            placeholder="Turn any screenshot into an editable design file"
            className="w-full rounded-lg border bg-[var(--bg2)] px-3 py-2 text-[14px] outline-none focus:border-amber-500 hairline"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={f.category} onChange={set("category")}
              className="w-full rounded-lg border bg-[var(--bg2)] px-3 py-2 text-[14px] outline-none focus:border-amber-500 hairline"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="X handle" hint="optional">
            <input
              value={f.xHandle} onChange={set("xHandle")} placeholder="@novalens" maxLength={32}
              className="w-full rounded-lg border bg-[var(--bg2)] px-3 py-2 text-[14px] outline-none focus:border-amber-500 hairline"
            />
          </Field>
        </div>

        <Field label="Website" hint="One card per domain, per season">
          <input
            required value={f.websiteUrl} onChange={set("websiteUrl")} placeholder="novalens.app"
            className="w-full rounded-lg border bg-[var(--bg2)] px-3 py-2 text-[14px] outline-none focus:border-amber-500 hairline"
          />
        </Field>

        <Field label="Email" hint="Only used to recover your card link">
          <input
            type="email" value={f.email} onChange={set("email")} placeholder="you@product.com"
            className="w-full rounded-lg border bg-[var(--bg2)] px-3 py-2 text-[14px] outline-none focus:border-amber-500 hairline"
          />
        </Field>

        {error && (
          <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-700 dark:text-rose-400">
            {error}{" "}
            {dupSlug && (
              <a href={`/c/${dupSlug}`} className="underline underline-offset-2">
                See that card
              </a>
            )}
          </p>
        )}

        <button
          type="submit" disabled={busy}
          className="w-full rounded-lg bg-[var(--fg)] px-4 py-2.5 text-[14px] font-medium text-[var(--bg)] disabled:opacity-40 sm:w-auto"
        >
          {busy ? "Claiming…" : `Claim card #${String(nextNumber).padStart(4, "0")} — free`}
        </button>

        <p className="text-[12px] leading-relaxed text-[var(--fg2)]">
          Claiming is free and permanent. Boosting is optional and paid. Your card stays in the deck
          whatever happens to your rank — and it never gains resale or investment value.
        </p>
      </form>

      {/* live preview */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--fg2)]">
          Your card
        </div>
        <div className="relative overflow-hidden rounded-xl border bg-[var(--bg2)] hairline">
          <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]"
            style={{ background: `linear-gradient(90deg, ${hex}, ${hex}22)` }} />
          <div className="flex items-center justify-between border-b px-4 pt-4 pb-2.5 hairline">
            <span className="num text-[10px] uppercase tracking-[0.18em] text-[var(--fg2)]">Season 01</span>
            <span className="num text-[15px] font-medium">#{String(nextNumber).padStart(4, "0")}</span>
          </div>
          <div className="flex flex-col gap-3 px-4 pt-4 pb-3">
            <div className="flex items-start gap-3">
              <span className="num grid size-11 shrink-0 place-items-center rounded-lg text-[15px] font-semibold"
                style={{ background: `${hex}1f`, color: hex, boxShadow: `inset 0 0 0 1px ${hex}33` }}>
                {monogram(name)}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-semibold tracking-tight">{name}</h3>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[var(--fg2)]">{tagline}</p>
              </div>
            </div>
            <div>
              <span className="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[var(--fg2)] hairline">
                {f.category}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t hairline">
            <div className="border-r px-4 py-3 hairline">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg2)]">Rank</div>
              <div className="num text-[22px] font-medium leading-tight text-[var(--fg2)]">—</div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg2)]">Public bid</div>
              <div className="num text-[22px] font-medium leading-tight text-[var(--fg2)]">$0</div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--fg2)]">
          You get a rank the moment you claim. Boosting is how you move it.
        </p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--fg2)]">{label}</span>
        {hint && <span className="text-[11px] text-[var(--fg2)]">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
