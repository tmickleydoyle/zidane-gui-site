"use client";
import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";

const CHAIN = ["Opus 5.5", "Sonnet 4.5", "GPT-5 Codex"];
type Stage = { label: string; tone: "ok" | "wait" | "warn" | "info"; ms: number; model: number };
const SCRIPT: Stage[] = [
  { label: "Streaming", tone: "ok", ms: 900, model: 0 },
  { label: "Waiting for the model", tone: "wait", ms: 1800, model: 0 },
  { label: "Retrying 2/3", tone: "warn", ms: 1000, model: 0 },
  { label: "Retrying 3/3", tone: "warn", ms: 1000, model: 0 },
  { label: "Falling back to Sonnet 4.5", tone: "info", ms: 1000, model: 1 },
  { label: "Streaming", tone: "ok", ms: 0, model: 1 },
];

export function FallbackDemo() {
  const [i, setI] = useState(-1);
  const [silent, setSilent] = useState(0);

  useEffect(() => {
    if (i < 0 || i >= SCRIPT.length - 1) return;
    const t = window.setTimeout(() => setI((x) => x + 1), SCRIPT[i].ms);
    return () => window.clearTimeout(t);
  }, [i]);

  // Five silent minutes, compressed.
  useEffect(() => {
    if (i !== 1) return;
    const id = window.setInterval(() => setSilent((s) => Math.min(300, s + 10)), 55);
    return () => window.clearInterval(id);
  }, [i]);

  const stage = i >= 0 ? SCRIPT[i] : null;
  const model = stage?.model ?? 0;
  const mm = Math.floor(silent / 60) + ":" + String(silent % 60).padStart(2, "0");

  return (
    <div className="fb">
      <div className="fb-chain">
        {CHAIN.map((m, k) => (
          <span key={m} className="fb-link">
            {k > 0 && <span className="fb-arrow">→</span>}
            <span className={cx("fb-model", k === model && "on", k < model && "past")}>
              <span className="fb-n">{k + 1}</span>
              {m}
            </span>
          </span>
        ))}
      </div>
      <div className="fb-status">
        {stage ? (
          <span key={i} className={"fb-pill " + stage.tone}>
            {stage.label}
            {i === 1 && <span className="fb-timer">silent {mm}</span>}
          </span>
        ) : (
          <span className="fb-pill idle">Idle</span>
        )}
      </div>
      <div className="fb-stream" aria-hidden>
        {Array.from({ length: 28 }, (_, k) => (
          <i key={k} className={cx(stage?.tone === "ok" && "go", stage && stage.tone !== "ok" && "stall")} style={{ animationDelay: k * 40 + "ms" }} />
        ))}
      </div>
      <div className="fb-foot">
        <button type="button" className="btn btn-ink btn-sm" disabled={i >= 0 && i < SCRIPT.length - 1} onClick={() => { setSilent(0); setI(0); }}>
          {i === SCRIPT.length - 1 ? "Stall it again" : "Stall the stream"}
        </button>
        <span className="note">
          <kbd>⇥</kbd> adds a fallback, <kbd>⌃⇧↑</kbd> <kbd>⌃⇧↓</kbd> reorder
        </span>
      </div>
    </div>
  );
}
