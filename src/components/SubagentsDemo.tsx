"use client";
import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";
import { Segmented } from "./Segmented";

type Task = { name: string; secs: number; child?: string };
const TASKS: Task[] = [
  { name: "audit src/http", secs: 2.4 },
  { name: "audit src/cache", secs: 1.6 },
  { name: "write retry tests", secs: 3, child: "build a flaky-server fixture" },
  { name: "update CHANGELOG.md", secs: 1 },
  { name: "check callers in web/", secs: 2 },
];
type Cap = "1" | "2" | "3" | "5";

export function SubagentsDemo() {
  const [cap, setCap] = useState<Cap>("3");
  const [progress, setProgress] = useState<number[] | null>(null);

  const running = progress !== null && progress.some((p) => p < 1);

  useEffect(() => {
    if (!running) return;
    const limit = Number(cap);
    const id = window.setInterval(() => {
      setProgress((prev) => {
        if (!prev) return prev;
        const next = [...prev];
        let slots = limit;
        for (let i = 0; i < next.length && slots > 0; i++) {
          if (next[i] >= 1) continue;
          next[i] = Math.min(1, next[i] + 0.1 / TASKS[i].secs);
          slots--;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [running, cap]);

  const start = () => {
    setProgress(TASKS.map(() => 0));
  };

  const limit = Number(cap);
  const active = new Set<number>();
  if (progress) {
    for (let i = 0, slots = limit; i < progress.length && slots > 0; i++) {
      if (progress[i] < 1) {
        active.add(i);
        slots--;
      }
    }
  }

  return (
    <div className="sa">
      <div className="cm-head">
        <span className="sa-label">Max parallel subagents</span>
        <Segmented compact label="Max parallel subagents" options={["1", "2", "3", "5"].map((v) => ({ value: v as Cap, label: v }))} value={cap} onChange={setCap} />
      </div>
      <div className="sa-root">
        <span className="sa-agent">Build</span> spawns {TASKS.length} sub-agents
      </div>
      <ul className="sa-list">
        {TASKS.map((t, i) => {
          const p = progress?.[i] ?? 0;
          const state = p >= 1 ? "done" : active.has(i) ? "run" : progress ? "queued" : "idle";
          return (
            <li key={t.name}>
              <div className={cx("sa-row", state)}>
                <span className="sa-state">{state === "done" ? "✓" : state === "run" ? "" : "·"}</span>
                <span className="sa-name">{t.name}</span>
                <span className="sa-bar"><i style={{ transform: "scaleX(" + p + ")" }} /></span>
              </div>
              {t.child && (
                <div className={cx("sa-row child", state)}>
                  <span className="sa-state">↳</span>
                  <span className="sa-name">{t.child}</span>
                  <span className="sa-depth">depth 2</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="fb-foot">
        <button type="button" className="btn btn-ink btn-sm" onClick={start} disabled={running}>
          {progress && !running ? "Spawn again" : "Spawn"}
        </button>
        <span className="note">
          {progress ? progress.filter((p) => p >= 1).length + " of " + TASKS.length + " finished" + (running ? ", " + active.size + " running" : "") : "Child events bubble up to the parent run."}
        </span>
      </div>
    </div>
  );
}
