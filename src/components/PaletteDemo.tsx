"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { fuzzy } from "@/lib/fuzzy";
import { Highlight } from "./Highlight";

type Row = { id: string; group: string; label: string; hint?: string; values?: string[] };

const ROWS: Row[] = [
  { id: "new", group: "Session actions", label: "New session", hint: "⌃N" },
  { id: "compact", group: "Session actions", label: "Compact conversation", hint: "⌃⇧K" },
  { id: "title", group: "Session actions", label: "Generate title", hint: "⌃⇧T" },
  { id: "md", group: "Session actions", label: "Export Markdown", hint: "⌃⇧E" },
  { id: "json", group: "Session actions", label: "Export JSON", hint: "⌃⇧J" },
  { id: "copyid", group: "Session actions", label: "Copy session id", hint: "⌃⇧C" },
  { id: "win", group: "Session actions", label: "Open conversation in new window" },
  { id: "s1", group: "Navigate", label: "Retry failed requests", hint: "weather" },
  { id: "s2", group: "Navigate", label: "Draft the v2 notes", hint: "weather" },
  { id: "s3", group: "Navigate", label: "Pick a release branch", hint: "weather" },
  { id: "main", group: "Navigate", label: "Main", hint: "⌃⇧M" },
  { id: "f1", group: "Files", label: "layout/resolve.ts" },
  { id: "f2", group: "Files", label: "src/http/fetch.ts" },
  { id: "f3", group: "Files", label: "src/sleep.ts" },
  { id: "f4", group: "Files", label: "CHANGELOG.md" },
  { id: "f5", group: "Files", label: "README.md" },
  { id: "c1", group: "Commands", label: "/help" },
  { id: "c2", group: "Commands", label: "/refresh" },
  { id: "c3", group: "Commands", label: "/cache" },
  { id: "c4", group: "Commands", label: "/commit", hint: "git" },
  { id: "c5", group: "Commands", label: "/review", hint: "git" },
  { id: "c6", group: "Commands", label: "/pr", hint: "git" },
  { id: "c7", group: "Commands", label: "/goal", hint: "loop" },
  { id: "m1", group: "Model", label: "Switch model", hint: "⌃M" },
  { id: "m2", group: "Model", label: "Reasoning effort", hint: "⌃L" },
  { id: "v1", group: "View", label: "Toggle sidebar", hint: "⌘B" },
  { id: "v2", group: "View", label: "Terminal drawer", hint: "⌃\u0060" },
  { id: "v3", group: "View", label: "Toggle side panel", hint: "⌃⇧A" },
  { id: "v4", group: "View", label: "Split right", hint: "⌘\\" },
  { id: "v5", group: "View", label: "Keyboard shortcuts", hint: "⌃Y" },
  { id: "appearance", group: "Settings", label: "Appearance", values: ["System", "Light", "Dark"] },
  { id: "preset", group: "Settings", label: "Conversation preset", values: ["Focused", "Balanced", "Detailed"] },
  { id: "approval", group: "Settings", label: "Approval mode", values: ["Ask", "Model decision", "Full access"] },
  { id: "subagents", group: "Settings", label: "Max parallel subagents", values: ["1", "2", "3", "5", "10", "Unlimited"] },
  { id: "import", group: "Settings", label: "Import repository" },
  { id: "setup", group: "Settings", label: "Run setup" },
];

const DEFAULTS: Record<string, number> = { appearance: 0, preset: 1, approval: 0, subagents: 2 };
const TRIES = ["layo res", "appear", "/re", "exp js"];

function labelOf(r: Row, values: Record<string, number>) {
  return r.values ? r.label + ": " + r.values[values[r.id] ?? 0] : r.label;
}

function verbFor(r: Row) {
  if (r.group === "Navigate") return "Opened session “" + r.label + "”";
  if (r.group === "Files") return "Opened " + r.label + " in Files";
  if (r.group === "Commands") return "Inserted " + r.label + " into the composer";
  return "Ran “" + r.label + "”" + (r.hint && r.hint.length < 6 ? "  ·  " + r.hint : "");
}

export function PaletteDemo({ anchorId }: { anchorId?: string }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [values, setValues] = useState(DEFAULTS);
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const out: { row: Row; idx: number[]; score: number }[] = [];
    for (const row of ROWS) {
      const m = fuzzy(q, labelOf(row, values));
      if (m) out.push({ row, ...m });
    }
    return q.trim() ? out.sort((a, b) => a.score - b.score) : out;
  }, [q, values]);

  const active = Math.min(sel, Math.max(0, results.length - 1));

  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>("[data-i='" + active + "']");
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop - 28;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight + 6;
  }, [active, results]);

  // The site answers to ⌘K / Ctrl+K too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const anchor = (anchorId && document.getElementById(anchorId)) || rootRef.current;
        anchor?.scrollIntoView({ block: "center", behavior: "smooth" });
        // Wait for the scroll so the palette is visible (and not inert) before focusing.
        window.setTimeout(() => {
          inputRef.current?.focus({ preventScroll: true });
          inputRef.current?.select();
        }, 650);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anchorId]);

  const flash = (text: string) => setToast((t) => ({ text, n: (t?.n ?? 0) + 1 }));

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const run = (row: Row) => {
    if (row.values) {
      const options = row.values;
      const next = ((values[row.id] ?? 0) + 1) % options.length;
      setValues((v) => ({ ...v, [row.id]: next }));
      flash(row.label + " → " + options[next]);
      return;
    }
    flash(verbFor(row));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel(Math.min(results.length - 1, active + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel(Math.max(0, active - 1));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      run(results[active].row);
    } else if (e.key === "Escape") {
      setQ("");
      setSel(0);
    }
  };

  return (
    <div className="pal-stage" ref={rootRef}>
      <div className="pal">
        <div className="pal-input">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.6 10.6 3.4 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search actions, sessions, files…"
            aria-label="Command palette"
            aria-controls="pal-list"
            aria-activedescendant={results[active] ? "pal-" + results[active].row.id : undefined}
            spellCheck={false}
            autoComplete="off"
          />
          <kbd>esc</kbd>
        </div>
        <div className="pal-list" id="pal-list" ref={listRef} role="listbox">
          {results.length === 0 && <div className="pal-empty">No matches. The real one also searches full session history.</div>}
          {results.map((r, i) => {
            const header = !q.trim() && (i === 0 || results[i - 1].row.group !== r.row.group);
            return (
              <div key={r.row.id}>
                {header && <div className="pal-group">{r.row.group}</div>}
                <div
                  id={"pal-" + r.row.id}
                  data-i={i}
                  role="option"
                  aria-selected={i === active}
                  className={cx("pal-row", i === active && "on")}
                  onMouseMove={() => i !== active && setSel(i)}
                  onClick={() => {
                    setSel(i);
                    run(r.row);
                  }}
                >
                  <span className="pal-label">
                    <Highlight text={labelOf(r.row, values)} idx={r.idx} />
                  </span>
                  {q.trim() ? <span className="pal-hint">{r.row.group}</span> : null}
                  {r.row.hint && <span className="pal-key">{r.row.hint}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="pal-foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> move <kbd>⏎</kbd> run
          </span>
          <span className="pal-tries">
            try
            {TRIES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setQ(t);
                  setSel(0);
                  inputRef.current?.focus();
                }}
              >
                {t}
              </button>
            ))}
          </span>
        </div>
        {toast && (
          <div key={toast.n} className="pal-toast" role="status">
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}
