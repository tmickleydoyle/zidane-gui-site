"use client";
import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";
import { Segmented } from "./Segmented";

type Step = { who: "model" | "tool" | "sandbox"; text: string; ms: number };
type Way = "code" | "turns";

const CODE_STEPS: Step[] = [
  { who: "model", text: "writes one script", ms: 900 },
  { who: "tool", text: "grep fetchJson → 5 files", ms: 450 },
  { who: "tool", text: "read_file × 5, in parallel", ms: 600 },
  { who: "sandbox", text: "filters the results", ms: 300 },
  { who: "model", text: "“3 callers across 5 files”", ms: 700 },
];
const TURN_STEPS: Step[] = [
  { who: "model", text: "calls grep", ms: 700 },
  { who: "tool", text: "grep fetchJson → 5 files", ms: 450 },
  ...["http/fetch.ts", "api/user.ts", "api/weather.ts", "jobs/sync.ts", "cli/index.ts"].flatMap((f) => [
    { who: "model" as const, text: "reads the result, calls read_file", ms: 650 },
    { who: "tool" as const, text: "read_file src/" + f, ms: 300 },
  ]),
  { who: "model", text: "“3 callers across 5 files”", ms: 700 },
];

const CODE = [
  "const hits = await tools.grep({ pattern: \"fetchJson\", output_mode: \"files_with_matches\" })",
  "const files = hits.split(\"\\n\").filter(Boolean)",
  "const bodies = await Promise.all(files.map((path) => tools.read_file({ path })))",
  "const callers = files.filter((f, i) => bodies[i].includes(\"await fetchJson(\"))",
  "return callers.length + \" callers across \" + files.length + \" files\"",
];

function Line({ src }: { src: string }) {
  const parts = src.split(/("[^"]*"|\b(?:const|await|return)\b|tools\.\w+|Promise\.all)/);
  return (
    <div>
      {parts.map((p, i) =>
        p.startsWith("\"") ? <span key={i} className="c-str">{p}</span>
        : /^(const|await|return)$/.test(p) ? <span key={i} className="c-kw">{p}</span>
        : p.startsWith("tools.") || p === "Promise.all" ? <span key={i} className="c-fn">{p}</span>
        : <span key={i}>{p}</span>,
      )}
    </div>
  );
}

export function CodemodeDemo() {
  const [way, setWay] = useState<Way>("code");
  const [step, setStep] = useState(-1);
  const steps = way === "code" ? CODE_STEPS : TURN_STEPS;
  const done = step >= steps.length;

  useEffect(() => {
    if (step < 0 || step >= steps.length) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), steps[step].ms);
    return () => window.clearTimeout(t);
  }, [step, steps]);

  const shown = steps.slice(0, Math.max(0, step + 1));
  const turns = shown.filter((s) => s.who === "model").length;
  const calls = shown.filter((s) => s.who === "tool").reduce((a, s) => a + (s.text.includes("× 5") ? 5 : 1), 0);

  return (
    <div className="cm">
      <div className="cm-head">
        <Segmented
          compact
          label="Strategy"
          options={[{ value: "code", label: "Codemode" }, { value: "turns", label: "Step by step" }]}
          value={way}
          onChange={(w) => {
            setWay(w);
            setStep(-1);
          }}
        />
        <button type="button" className="btn btn-ink btn-sm" onClick={() => setStep(0)} disabled={step >= 0 && !done}>
          {done ? "Run again" : "Run"}
        </button>
      </div>
      {way === "code" ? (
        <pre className="cm-code">{CODE.map((l) => <Line key={l} src={l} />)}</pre>
      ) : (
        <pre className="cm-code dim">{"grep → model → read_file → model → read_file → model → …"}</pre>
      )}
      <ol className="cm-log">
        {shown.slice(-5).map((s, i, arr) => (
          <li key={step + "-" + i} className={cx(s.who, i === arr.length - 1 && !done && "live")}>
            <span className="cm-who">{s.who}</span>
            <span>{s.text}</span>
          </li>
        ))}
        {step < 0 && <li className="cm-empty">Press Run to find every caller of fetchJson.</li>}
      </ol>
      <div className="cm-count">
        <span><b>{turns}</b> model turns</span>
        <span><b>{calls}</b> tool calls</span>
      </div>
    </div>
  );
}
