export function usd(cents: number): string {
  if (cents === 0) return "$0";
  if (cents % 100 === 0) return `$${(cents / 100).toLocaleString("en-US")}`;
  return `$${(cents / 100).toFixed(2)}`;
}

export function claimNo(n: number): string {
  return `#${String(n).padStart(4, "0")}`;
}

export function ago(d: Date | string): string {
  const t = typeof d === "string" ? new Date(d) : d;
  const s = Math.max(1, Math.floor((Date.now() - t.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `${dd}d ago`;
  return t.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function monthYear(d: Date | string): string {
  const t = typeof d === "string" ? new Date(d) : d;
  return t.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const ACCENT_HEX: Record<string, string> = {
  amber: "#f59e0b",
  violet: "#8b5cf6",
  sky: "#0ea5e9",
  emerald: "#10b981",
  rose: "#f43f5e",
};
export function accentHex(a: string) {
  return ACCENT_HEX[a] ?? ACCENT_HEX.amber;
}

export function monogram(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function slugify(n: string) {
  return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function normalizeDomain(url: string): string {
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  const h = new URL(u).hostname.toLowerCase();
  return h.replace(/^www\./, "");
}
