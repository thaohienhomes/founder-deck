"use client";
import { useSyncExternalStore, useCallback } from "react";

const EVENT = "fd-theme-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
function getSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  // the <html data-theme> attribute is the source of truth; it is set by the
  // inline script in the document head before first paint
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light" as const);

  const toggle = useCallback(() => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("fd-theme", next);
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="grid size-8 place-items-center rounded-md border text-[var(--fg2)] transition-colors hover:text-[var(--fg)] hairline"
    >
      <span aria-hidden className="text-[13px]">
        {theme === "dark" ? "☾" : "☀"}
      </span>
    </button>
  );
}
