"use client";
import { useState } from "react";
import { cx } from "@/lib/cx";

export function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="5" y="5" width="8.5" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 3.2A1.8 1.8 0 0 0 8.8 2H4a2 2 0 0 0-2 2v4.8c0 .8.5 1.4 1.2 1.7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard blocked: still flash the state */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return { copied, copy };
}

export function CopyPill({ text, label, className }: { text: string; label?: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button type="button" className={cx("copy-pill", className)} onClick={() => copy(text)} aria-label={"Copy " + text}>
      <span className="copy-pill-label">{copied ? "Copied" : label ?? text}</span>
      <CopyIcon />
    </button>
  );
}
