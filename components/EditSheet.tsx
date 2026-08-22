"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

type Props = {
  slug: string;
  ownerToken: string;
  productName: string;
  tagline: string;
  category: string;
  logoUrl: string | null;
  xHandle: string | null;
  onClose: () => void;
};

export function EditSheet(props: Props) {
  const router = useRouter();
  const [f, setF] = useState({
    productName: props.productName,
    tagline: props.tagline,
    category: props.category,
    logoUrl: props.logoUrl ?? "",
    xHandle: props.xHandle ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/card", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: props.slug, k: props.ownerToken, ...f }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      props.onClose();
      router.refresh();
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
        aria-label="Edit card details"
        onClick={(e) => e.stopPropagation()}
        className="rise-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border bg-[var(--bg)] p-5 sm:rounded-2xl hairline"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[15px] font-semibold tracking-tight">Edit card details</h2>
          <button
            onClick={props.onClose}
            aria-label="Close"
            className="grid size-7 shrink-0 place-items-center rounded-md border text-[var(--fg2)] hover:text-[var(--fg)] hairline"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Product name">
            <input
              maxLength={60} value={f.productName} onChange={set("productName")}
              className="w-full rounded-lg border bg-[var(--bg2)] px-3 py-2 text-[14px] outline-none focus:border-amber-500 hairline"
            />
          </Field>

          <Field label="One-line pitch" hint={`${f.tagline.length}/90`}>
            <input
              maxLength={90} value={f.tagline} onChange={set("tagline")}
              className="w-full rounded-lg border bg-[var(--bg2)] px-3 py-2 text-[14px] outline-none focus:border-amber-500 hairline"
            />
          </Field>

          <Field label="Category">
            <select
              value={f.category} onChange={set("category")}
              className="w-full rounded-lg border bg-[var(--bg2)] px-3 py-2 text-[14px] outline-none focus:border-amber-500 hairline"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Logo URL" hint="optional">
            <input
              value={f.logoUrl} onChange={set("logoUrl")} placeholder="https://…"
              className="w-full rounded-lg border bg-[var(--bg2)] px-3 py-2 text-[14px] outline-none focus:border-amber-500 hairline"
            />
          </Field>

          <Field label="X handle" hint="optional">
            <input
              value={f.xHandle} onChange={set("xHandle")} placeholder="@novalens" maxLength={32}
              className="w-full rounded-lg border bg-[var(--bg2)] px-3 py-2 text-[14px] outline-none focus:border-amber-500 hairline"
            />
          </Field>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-700 dark:text-rose-400">
            {error}
          </p>
        )}

        <button
          disabled={busy}
          onClick={save}
          className="mt-4 w-full rounded-lg bg-[var(--fg)] px-4 py-2.5 text-[14px] font-medium text-[var(--bg)] transition-opacity disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
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
