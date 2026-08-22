import Link from "next/link";

const VIEWS = [
  { key: "ranked", label: "Ranked", hint: "By total public bid" },
  { key: "new", label: "New arrivals", hint: "Most recently claimed" },
  { key: "rising", label: "Rising", hint: "Boosted in the last 24h" },
  { key: "founding", label: "Founding set", hint: "Claim #0001–#0100" },
  { key: "random", label: "Random draw", hint: "A different deck every time" },
] as const;

export function DeckToolbar({
  view,
  q,
  category,
  cats,
}: {
  view: string;
  q?: string;
  category?: string;
  cats: { category: string; n: number }[];
}) {
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { view, q, category, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/cards?${s}` : "/cards";
  };

  const active = VIEWS.find((v) => v.key === view) ?? VIEWS[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={qs({ view: v.key })}
              className={`shrink-0 rounded-md border px-2.5 py-1.5 text-[13px] transition-colors ${
                v.key === view
                  ? "border-transparent bg-[var(--fg)] text-[var(--bg)]"
                  : "text-[var(--fg2)] hover:text-[var(--fg)] hairline"
              }`}
            >
              {v.label}
            </Link>
          ))}
        </div>

        <form action="/cards" className="flex shrink-0 gap-2">
          <input type="hidden" name="view" value={view} />
          {category && <input type="hidden" name="category" value={category} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search the deck…"
            className="w-full rounded-md border bg-[var(--bg2)] px-3 py-1.5 text-[13px] outline-none placeholder:text-[var(--fg2)] focus:border-amber-500 sm:w-56 hairline"
          />
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
        <span className="text-[var(--fg2)]">{active.hint} ·</span>
        <Link
          href={qs({ category: undefined })}
          className={`rounded border px-1.5 py-0.5 ${!category ? "border-transparent bg-[var(--fg)] text-[var(--bg)]" : "text-[var(--fg2)] hover:text-[var(--fg)] hairline"}`}
        >
          All
        </Link>
        {cats.map((c) => (
          <Link
            key={c.category}
            href={qs({ category: c.category })}
            className={`rounded border px-1.5 py-0.5 ${category === c.category ? "border-transparent bg-[var(--fg)] text-[var(--bg)]" : "text-[var(--fg2)] hover:text-[var(--fg)] hairline"}`}
          >
            {c.category}
          </Link>
        ))}
      </div>
    </div>
  );
}
