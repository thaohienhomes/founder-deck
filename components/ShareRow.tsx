"use client";
import { useState } from "react";

export function ShareRow({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={intent}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border px-3 py-1.5 text-[12px] text-[var(--fg2)] transition-colors hover:text-[var(--fg)] hairline"
      >
        Post on X
      </a>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {}
        }}
        className="rounded-lg border px-3 py-1.5 text-[12px] text-[var(--fg2)] transition-colors hover:text-[var(--fg)] hairline"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
