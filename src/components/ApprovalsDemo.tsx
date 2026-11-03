"use client";
import { useState } from "react";
import { cx } from "@/lib/cx";
import { Segmented } from "./Segmented";

type Hunk = { id: number; title: string; lines: { t: "add" | "del" | "ctx"; s: string }[] };
const HUNKS: Hunk[] = [
  { id: 1, title: "@@ -1,2 +1,3 @@", lines: [{ t: "add", s: "import { sleep } from '../sleep'" }, { t: "ctx", s: "import { HttpError } from './errors'" }] },
  {
    id: 2, title: "@@ -18,2 +19,6 @@",
    lines: [
      { t: "del", s: "  const res = await fetch(url, init)" },
      { t: "add", s: "  let res = await fetch(url, init)" },
      { t: "add", s: "  for (let attempt = 0; res.status >= 500 && attempt < 3; attempt++) {" },
      { t: "add", s: "    await sleep(400 * 2 ** attempt)" },
      { t: "add", s: "    res = await fetch(url, init)" },
      { t: "add", s: "  }" },
    ],
  },
  { id: 3, title: "@@ -31,1 +36,2 @@", lines: [{ t: "add", s: "  console.log('fetchJson', url, res.status)" }, { t: "ctx", s: "  return res.json()" }] },
];

type Mode = "ask" | "model" | "full";
const MODES: { value: Mode; label: string }[] = [
  { value: "ask", label: "Ask" },
  { value: "model", label: "Model decision" },
  { value: "full", label: "Full access" },
];
const MODE_NOTE: Record<Mode, string> = {
  ask: "The default. Anything that changes your project waits for your answer.",
  model: "A decision model approves clearly intended calls and blocks clearly risky ones. Unsure means it asks you.",
  full: "Everything runs without asking. Turn on the sandbox to keep it inside your project.",
};

type Call = { label: string; safe?: string; words?: string[]; model: "approve" | "block" };
const CALLS: Call[] = [
  { label: "Search the code for fetchJson", safe: "read-only", model: "approve" },
  { label: "Open localhost:5173", safe: "local page", model: "approve" },
  { label: "Run  git status", words: ["git"], model: "approve" },
  { label: "Run  cd src && bun test", words: ["cd", "bun"], model: "approve" },
  { label: "Edit  src/http/fetch.ts", model: "approve" },
  { label: "Run  rm -rf ~/.ssh", words: ["rm"], model: "block" },
];
const SAFELIST = ["git", "bun", "cd"];

function decide(call: Call, mode: Mode, list: Set<string>): { kind: "run" | "ask" | "block"; why: string } {
  if (mode === "full") return { kind: "run", why: "full access" };
  if (call.safe) return { kind: "run", why: call.safe };
  if (call.words && call.words.every((w) => list.has(w))) return { kind: "run", why: "always allowed" };
  if (mode === "model") return call.model === "approve" ? { kind: "run", why: "model approves" } : { kind: "block", why: "model blocks" };
  return { kind: "ask", why: call.words && call.words.some((w) => list.has(w)) ? "needs every part allowed" : "asks you" };
}

export function ApprovalsDemo() {
  const [picked, setPicked] = useState<Set<number>>(new Set([1, 2, 3]));
  const [result, setResult] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("ask");
  const [list, setList] = useState<Set<string>>(new Set(["git"]));

  const toggle = (id: number) => {
    setResult(null);
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const n = picked.size;
  const answer = (k: string) => {
    if (k === "d") return setResult("Denied. The agent reads that you refused.");
    if (n === 0) return;
    const how = k === "s" ? " for this session" : k === "p" ? ", and it won't ask again" : "";
    setResult((n === 3 ? "Applied all changes" : "Applied " + n + " of 3 changes") + how + ". The agent knows which ones.");
  };
  const allowLabel = n === 3 ? "Allow" : n === 0 ? "Allow (none selected)" : "Apply selected (" + n + " of 3)";

  return (
    <div className="appr-grid">
      <div
        className="appr-card"
        tabIndex={0}
        aria-label="Review an edit. Keys 1 to 3 toggle changes; a, s, p, d answer."
        onKeyDown={(e) => {
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          const k = e.key.toLowerCase();
          if (k === "1" || k === "2" || k === "3") toggle(Number(k));
          else if (k === "a" || k === "s" || k === "p" || k === "d") answer(k);
          else return;
          e.preventDefault();
        }}
      >
        <div className="approval-head">
          <span className="dot-warn" />
          <code>edit</code>
          <span>src/http/fetch.ts</span>
          <span className="approval-stat">3 changes</span>
        </div>
        {HUNKS.map((h) => (
          <div key={h.id} className={cx("hunk", !picked.has(h.id) && "off")}>
            <label className="hunk-head">
              <input type="checkbox" checked={picked.has(h.id)} onChange={() => toggle(h.id)} />
              <span>{h.title}</span>
              <kbd>{h.id}</kbd>
            </label>
            <div className="diff">
              {h.lines.map((l, i) => (
                <div key={i} className={l.t === "ctx" ? undefined : l.t}>
                  <span className="sign">{l.t === "add" ? "+" : l.t === "del" ? "-" : " "}</span>
                  {l.s}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="approval-actions">
          <button type="button" className="abtn primary" disabled={n === 0} onClick={() => answer("a")}>
            {allowLabel} <kbd>a</kbd>
          </button>
          <button type="button" className="abtn" onClick={() => answer("s")}>For session <kbd>s</kbd></button>
          <button type="button" className="abtn" onClick={() => answer("p")}>Always <kbd>p</kbd></button>
          <button type="button" className="abtn danger" onClick={() => answer("d")}>Deny <kbd>d</kbd></button>
        </div>
        <div className="appr-result" aria-live="polite">{result ?? "Untick the stray console.log, then allow."}</div>
      </div>

      <div className="appr-side">
        <Segmented fill label="Tool approvals" options={MODES} value={mode} onChange={setMode} />
        <p className="note appr-note">{MODE_NOTE[mode]}</p>
        <div className="appr-safelist">
          <span className="appr-sl-label">Always allowed</span>
          {SAFELIST.map((w) => (
            <button
              key={w}
              type="button"
              className={cx("sl-chip", list.has(w) && "on")}
              aria-pressed={list.has(w)}
              onClick={() =>
                setList((s) => {
                  const nx = new Set(s);
                  if (nx.has(w)) nx.delete(w);
                  else nx.add(w);
                  return nx;
                })
              }
            >
              {w + " …"}
            </button>
          ))}
        </div>
        <ul className="appr-calls">
          {CALLS.map((c) => {
            const d = decide(c, mode, list);
            return (
              <li key={c.label}>
                <code>{c.label}</code>
                <span className={"verdict " + d.kind}>{d.why}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
