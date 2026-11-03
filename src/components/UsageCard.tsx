"use client";
import { useState } from "react";
import { Segmented } from "./Segmented";

// Deterministic sample data, so server and client render the same heatmap.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(8_02_05);
const CELLS: number[] = Array.from({ length: 26 * 7 }, (_, i) => {
  const day = i % 7;
  const week = Math.floor(i / 7);
  const weekend = day >= 5 ? 0.45 : 1;
  const ramp = 0.35 + (week / 26) * 0.75;
  const v = rand() * weekend * ramp;
  return v < 0.18 ? 0 : v < 0.38 ? 1 : v < 0.58 ? 2 : v < 0.75 ? 3 : 4;
});

type Range = "all" | "30d" | "7d";
const STATS: Record<Range, [string, string][]> = {
  all: [["Sessions", "412"], ["Messages", "9,841"], ["Total tokens", "182M"], ["Active days", "131"], ["Streak", "12 / 34"], ["Peak hour", "10:00"], ["Favorite model", "Opus 5.5"]],
  "30d": [["Sessions", "64"], ["Messages", "1,522"], ["Total tokens", "31.4M"], ["Active days", "24"], ["Streak", "12 / 34"], ["Peak hour", "11:00"], ["Favorite model", "Opus 5.5"]],
  "7d": [["Sessions", "17"], ["Messages", "402"], ["Total tokens", "8.9M"], ["Active days", "7"], ["Streak", "12 / 34"], ["Peak hour", "10:00"], ["Favorite model", "Sonnet 4.5"]],
};

export function UsageCard() {
  const [range, setRange] = useState<Range>("all");
  return (
    <div className="usage-card panel">
      <div className="usage-head">
        <span className="usage-title">Welcome back</span>
        <Segmented compact label="Range" options={[{ value: "all", label: "All" }, { value: "30d", label: "30d" }, { value: "7d", label: "7d" }]} value={range} onChange={setRange} />
      </div>
      <div className="heat" aria-label="Activity over the last 26 weeks" role="img">
        {CELLS.map((v, i) => (
          <i key={i} className={"l" + v} />
        ))}
      </div>
      <dl className="usage-stats">
        {STATS[range].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="note">Sample data.</p>
    </div>
  );
}
