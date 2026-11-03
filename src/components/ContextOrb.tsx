"use client";
import { useState } from "react";
import { cx } from "@/lib/cx";

const WINDOW = 200_000;
type Seg = { id: string; label: string; tokens: number; color: string };

export function ContextOrb() {
  const [lazy, setLazy] = useState(false);
  const [compacted, setCompacted] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  const used: Seg[] = [
    { id: "system", label: "Instructions", tokens: 2900, color: "#e8ecf1" },
    { id: "rules", label: "Project rules", tokens: 1200, color: "#94a3b8" },
    { id: "tools", label: "Built-in tools", tokens: 8400, color: "#0075c3" },
    { id: "mcp", label: "Connected tools", tokens: lazy ? 0 : 14600, color: "#3b82c4" },
    { id: "skills", label: "Skills", tokens: 600, color: "#64748b" },
    { id: "catalog", label: "Tool index", tokens: lazy ? 1100 : 0, color: "#85cff3" },
    { id: "conv", label: "Conversation", tokens: compacted ? 7400 : 61300, color: "#26a9f1" },
    { id: "buffer", label: "Reserved for compaction", tokens: 33000, color: "#2a323b" },
  ];
  const total = used.reduce((a, s) => a + s.tokens, 0);
  const segs: Seg[] = [...used, { id: "free", label: "Free", tokens: WINDOW - total, color: "#1a2129" }];
  const pct = Math.round(((total - 33000) / WINDOW) * 100);

  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="orb-card panel">
      <div className="orb-top">
        <svg viewBox="0 0 180 180" className="orb" role="img" aria-label={"Context window " + pct + "% used"}>
          {segs.map((s) => {
            const len = (s.tokens / WINDOW) * C;
            const el = (
              <circle
                key={s.id}
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === s.id ? 22 : 16}
                strokeDasharray={Math.max(0, len - (len > 2 ? 1.5 : 0)) + " " + C}
                strokeDashoffset={-offset}
                className={cx("orb-seg", hover && hover !== s.id && "dim")}
                onMouseEnter={() => setHover(s.id)}
                onMouseLeave={() => setHover(null)}
              />
            );
            offset += len;
            return el;
          })}
          <text x="90" y="88" textAnchor="middle" className="orb-pct">{pct}%</text>
          <text x="90" y="108" textAnchor="middle" className="orb-sub">of 200k</text>
        </svg>
        <ul className="orb-legend">
          {segs.map((s) => (
            <li
              key={s.id}
              className={cx(hover === s.id && "on", s.tokens === 0 && "zero")}
              onMouseEnter={() => setHover(s.id)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="dot" style={{ background: s.color }} />
              <span>{s.label}</span>
              <span className="orb-n">{(s.tokens / 1000).toFixed(1)}k</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="orb-actions">
        <button type="button" className={cx("switch", lazy && "on")} role="switch" aria-checked={lazy} onClick={() => setLazy((v) => !v)}>
          <span className="switch-knob" />
          <span>Load tools on demand</span>
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCompacted((v) => !v)}>
          {compacted ? "Undo" : "Compact"} <kbd>⌃⇧K</kbd>
        </button>
      </div>
      <p className="note">
        {lazy
          ? "Connected tools stay out of the way until the agent looks one up. Only a short index rides along."
          : "Every connected tool is described to the model on every turn. Try loading them on demand."}
      </p>
    </div>
  );
}
