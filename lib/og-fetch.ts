import { promises as dns } from "node:dns";
import net from "node:net";

/**
 * Best-effort Open Graph scraper for the claim flow. Never throws — a claim
 * must still succeed even if the target site is down, slow, or hostile.
 * Every failure mode (bad URL, private IP, timeout, oversized body, redirect
 * to somewhere unsafe) resolves to EMPTY, never a rejected promise.
 */
export type OgMeta = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  favicon: string | null;
};

const EMPTY: OgMeta = { title: null, description: null, imageUrl: null, siteName: null, favicon: null };

const FETCH_TIMEOUT_MS = 5000;
const MAX_BYTES = 1_000_000;
const MAX_REDIRECTS = 2;
const USER_AGENT = "FounderDeckBot/1.0 (+og fetch)";

/** Loopback, RFC1918, link-local (incl. the 169.254.169.254 cloud metadata IP), and unique-local ranges. */
function isDisallowedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true;
    if (a === 0) return true;
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const norm = ip.toLowerCase();
    if (norm === "::1" || norm === "::") return true;
    if (norm.startsWith("fe80:")) return true; // link-local
    if (/^f[cd][0-9a-f]{0,2}:/.test(norm)) return true; // fc00::/7 unique local
    const mapped = norm.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isDisallowedIp(mapped[1]);
    return false;
  }
  return true; // not a recognizable IP — reject rather than guess
}

async function isSafeUrl(url: URL): Promise<boolean> {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const hostname = url.hostname;
  if (net.isIP(hostname)) return !isDisallowedIp(hostname);
  try {
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    if (!records.length) return false;
    return records.every((r) => !isDisallowedIp(r.address));
  } catch {
    return false;
  }
}

async function readCapped(res: Response, max: number): Promise<string | null> {
  if (!res.body) {
    try {
      return (await res.text()).slice(0, max);
    } catch {
      return null;
    }
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.length;
      if (total > max) {
        const keep = value.length - (total - max);
        if (keep > 0) chunks.push(value.subarray(0, keep));
        await reader.cancel().catch(() => {});
        break;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractMetaTags(html: string): Record<string, string> {
  const map: Record<string, string> = {};
  const metaRe = /<meta\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html))) {
    const tag = m[0];
    const keyMatch = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i);
    const contentMatch = tag.match(/content\s*=\s*["']([^"']*)["']/i);
    if (!keyMatch || !contentMatch) continue;
    const key = keyMatch[1].toLowerCase();
    if (!(key in map)) map[key] = decodeEntities(contentMatch[1].trim());
  }
  return map;
}

function resolveUrl(u: string, base: URL): string | null {
  try {
    const resolved = new URL(u, base);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    return resolved.toString();
  } catch {
    return null;
  }
}

function parseOg(html: string, baseUrl: URL): OgMeta {
  const meta = extractMetaTags(html);

  const titleTagMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const titleTag = titleTagMatch ? decodeEntities(titleTagMatch[1].trim()) : null;

  const title = meta["og:title"] || meta["twitter:title"] || titleTag || null;
  const description = meta["og:description"] || meta["twitter:description"] || meta["description"] || null;
  const siteName = meta["og:site_name"] || null;
  const imageRaw = meta["og:image"] || meta["og:image:url"] || meta["twitter:image"] || null;
  const imageUrl = imageRaw ? resolveUrl(imageRaw, baseUrl) : null;

  const iconMatch =
    html.match(/<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'](?:shortcut icon|icon|apple-touch-icon)["']/i);
  const favicon = resolveUrl(iconMatch ? iconMatch[1] : "/favicon.ico", baseUrl);

  return {
    title: title ? title.slice(0, 200) : null,
    description: description ? description.slice(0, 300) : null,
    imageUrl,
    siteName: siteName ? siteName.slice(0, 100) : null,
    favicon,
  };
}

export async function fetchOgMeta(rawUrl: string): Promise<OgMeta> {
  try {
    let current: URL;
    try {
      current = new URL(rawUrl);
    } catch {
      return EMPTY;
    }

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isSafeUrl(current))) return EMPTY;

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(current.toString(), {
          method: "GET",
          redirect: "manual",
          signal: ctrl.signal,
          headers: { "user-agent": USER_AGENT, accept: "text/html,*/*" },
        });
      } catch {
        return EMPTY;
      } finally {
        clearTimeout(timer);
      }

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return EMPTY;
        const next = resolveUrl(loc, current);
        if (!next) return EMPTY;
        current = new URL(next);
        continue;
      }

      if (!res.ok) return EMPTY;

      const html = await readCapped(res, MAX_BYTES);
      if (html === null) return EMPTY;
      return parseOg(html, current);
    }

    return EMPTY; // exceeded redirect budget
  } catch {
    return EMPTY;
  }
}
