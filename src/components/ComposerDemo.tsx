"use client";
import { useMemo, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { fuzzy } from "@/lib/fuzzy";
import { Segmented } from "./Segmented";
import { Highlight } from "./Highlight";

type Agent = "build" | "plan" | "codemode";
const AGENTS: { value: Agent; label: string }[] = [
  { value: "build", label: "Build" },
  { value: "plan", label: "Plan" },
  { value: "codemode", label: "Codemode" },
];
const AGENT_NOTE: Record<Agent, string> = {
  build: "Edits files and runs commands.",
  plan: "Reads and proposes. Nothing changes until you approve the plan.",
  codemode: "Writes one small script that runs many steps at once.",
};
const EFFORTS = ["Low", "Medium", "High"];
const MODELS = ["Opus 5.5", "Sonnet 4.5", "Haiku 4.5", "GPT-5 Codex", "Gemini 2.5 Pro", "Grok 4"];

type Item = { value: string; label: string; note?: string };
const FILES: Item[] = ["src/http/fetch.ts", "src/http/fetch.test.ts", "src/sleep.ts", "CHANGELOG.md", "README.md", "package.json"].map((f) => ({ value: f, label: f }));
const CHATS: Item[] = ["Retry failed requests", "Draft the v2 notes", "Pick a release branch", "Main"].map((c) => ({ value: c, label: c }));
const COMMANDS: Item[] = [
  { value: "/help", label: "/help", note: "built in" },
  { value: "/refresh", label: "/refresh", note: "built in" },
  { value: "/cache", label: "/cache", note: "built in" },
  { value: "/commit", label: "/commit", note: "write the commit" },
  { value: "/review", label: "/review", note: "review the changes" },
  { value: "/fix-comments", label: "/fix-comments", note: "address PR feedback" },
  { value: "/pr", label: "/pr", note: "open a pull request" },
  { value: "/goal", label: "/goal", note: "keep going until done" },
  { value: "/review:pr", label: "/review:pr", note: "your own command" },
];
const TRANSCRIPT: Item[] = [
  "Retry failed requests in fetchJson, with backoff.",
  "fetchJson now retries server errors up to three times…",
  "Add jitter to sleep",
  "Note the change in CHANGELOG.md",
].map((t) => ({ value: t, label: t }));

type Trigger = { kind: "@" | "#" | "/" | "?"; q: string; start: number };

function findTrigger(text: string): Trigger | null {
  if (text.startsWith("?")) return { kind: "?", q: text.slice(1), start: 0 };
  const slash = /^\/(\S*)$/.exec(text);
  if (slash) return { kind: "/", q: slash[1], start: 0 };
  const m = /(^|\s)([@#])(\S*)$/.exec(text);
  if (m) return { kind: m[2] as "@" | "#", q: m[3], start: m.index + m[1].length };
  return null;
}

const SOURCES: Record<Trigger["kind"], Item[]> = { "@": FILES, "#": CHATS, "/": COMMANDS, "?": TRANSCRIPT };
const TRIGGER_HELP: { key: string; text: string }[] = [
  { key: "@", text: "mention a file" },
  { key: "#", text: "mention another chat" },
  { key: "/", text: "run a command or skill" },
  { key: "!", text: "shell mode" },
  { key: "?", text: "search the transcript" },
];

function Token({ t }: { t: string }) {
  if (/^[@#]\S+/.test(t) || /^\/\S+/.test(t)) return <span className="tok">{t}</span>;
  return <>{t}</>;
}

export function ComposerDemo() {
  const [text, setText] = useState("");
  const [agent, setAgent] = useState<Agent>("build");
  const [effort, setEffort] = useState(2);
  const [chain, setChain] = useState(["Opus 5.5", "Sonnet 4.5"]);
  const [menu, setMenu] = useState(false);
  const [cacheHint, setCacheHint] = useState(false);
  const [sel, setSel] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [sent, setSent] = useState<{ text: string; mode: string; agent: Agent; n: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const trigger = findTrigger(text);
  const items = useMemo(() => {
    if (!trigger) return [];
    return SOURCES[trigger.kind]
      .map((it) => ({ it, m: fuzzy(trigger.q, it.label) }))
      .filter((x): x is { it: Item; m: { score: number; idx: number[] } } => x.m !== null)
      .slice(0, 6);
  }, [trigger]);
  const open = !!trigger && items.length > 0 && dismissed !== text;
  const active = Math.min(sel, Math.max(0, items.length - 1));
  const mode = text.startsWith("!") ? "shell" : text.startsWith("?") ? "search" : "chat";

  const accept = (it: Item) => {
    if (!trigger) return;
    if (trigger.kind === "?") {
      setText("");
      setSent((s) => [...s.slice(-2), { text: "Jumped to: " + it.label, mode: "search", agent, n: Date.now() }]);
      return;
    }
    const prefix = trigger.kind === "/" ? "" : trigger.kind;
    setText(text.slice(0, trigger.start) + prefix + it.value + " ");
    setSel(0);
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setSent((s) => [...s.slice(-2), { text: t, mode, agent, n: Date.now() }]);
    setText("");
  };

  const insert = (ch: string) => {
    const base = ch === "!" || ch === "?" || ch === "/" ? "" : text && !text.endsWith(" ") ? text + " " : text;
    setText(base + ch);
    setSel(0);
    inputRef.current?.focus();
  };

  const pickModel = (m: string) => {
    if (m === chain[0]) return setMenu(false);
    setChain((c) => [m, ...c.filter((x) => x !== m)].slice(0, 3));
    setCacheHint(sent.length > 0);
    setMenu(false);
  };
  const addFallback = (m: string) => setChain((c) => (c.includes(m) ? c : [...c, m].slice(0, 4)));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.shiftKey && e.key.toLowerCase() === "i") {
      e.preventDefault();
      setAgent((a) => AGENTS[(AGENTS.findIndex((x) => x.value === a) + 1) % AGENTS.length].value);
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "m") {
      e.preventDefault();
      setMenu((m) => !m);
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setEffort((x) => (x + 1) % EFFORTS.length);
      return;
    }
    if (open) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSel(Math.min(items.length - 1, active + 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSel(Math.max(0, active - 1)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); accept(items[active].it); return; }
      if (e.key === "Escape") { setDismissed(text); return; }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="cmp-stage">
      <div className="cmp-side">
        <p className="cmp-side-title">Type one of these</p>
        {TRIGGER_HELP.map((t) => (
          <button key={t.key} type="button" className="cmp-trigger" onClick={() => insert(t.key)}>
            <kbd>{t.key}</kbd>
            <span>{t.text}</span>
          </button>
        ))}
        <p className="cmp-side-title" style={{ marginTop: 18 }}>While typing</p>
        <div className="cmp-keys">
          <span><kbd>⇧⌘I</kbd> cycle agent</span>
          <span><kbd>⌃M</kbd> model chain</span>
          <span><kbd>⌃L</kbd> reasoning effort</span>
          <span><kbd>⏎</kbd> send</span>
        </div>
      </div>

      <div className="cmp-app">
        <div className="cmp-sent">
          {sent.length === 0 && <div className="cmp-empty">Messages you send land here.</div>}
          {sent.map((s) => (
            <div key={s.n} className={cx("cmp-msg", s.mode)}>
              <span className="cmp-msg-agent">{s.mode === "shell" ? "$" : s.mode === "search" ? "?" : AGENTS.find((a) => a.value === s.agent)?.label}</span>
              <span>
                {(s.mode === "shell" ? s.text.slice(1).trim() : s.text).split(/(\s+)/).map((t, i) => (
                  <Token key={i} t={t} />
                ))}
              </span>
            </div>
          ))}
        </div>

        <div className={cx("cmp-box", mode)}>
          {open && (
            <div className="cmp-pop" role="listbox">
              <div className="cmp-pop-head">
                {trigger?.kind === "@" ? "Files" : trigger?.kind === "#" ? "Chats" : trigger?.kind === "/" ? "Commands and skills" : "In this transcript"}
              </div>
              {items.map(({ it, m }, i) => (
                <div
                  key={it.value}
                  role="option"
                  aria-selected={i === active}
                  className={cx("cmp-pop-row", i === active && "on")}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    accept(it);
                  }}
                  onMouseMove={() => i !== active && setSel(i)}
                >
                  <span><Highlight text={it.label} idx={m.idx} /></span>
                  {it.note && <span className="cmp-pop-note">{it.note}</span>}
                </div>
              ))}
            </div>
          )}
          {mode !== "chat" && <div className="cmp-mode">{mode === "shell" ? "Shell mode" : "Search the transcript"}</div>}
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Chat with Zidane…  try @, #, / or !"
            aria-label="Composer"
            spellCheck={false}
            autoComplete="off"
          />
          <div className="cmp-row">
            <Segmented dark compact label="Agent" options={AGENTS} value={agent} onChange={setAgent} />
            <div className="cmp-model">
              <button type="button" className="cmp-chip" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                {chain[0]}
                {chain.length > 1 && <span className="cmp-plus">+{chain.length - 1}</span>}
              </button>
              {menu && (
                <div className="cmp-menu">
                  <div className="cmp-pop-head">Chain · falls back in order</div>
                  {chain.map((m, i) => (
                    <div key={m} className="cmp-chain-row">
                      <span className="cmp-chain-n">{i + 1}</span>
                      <span>{m}</span>
                      {i > 0 && (
                        <button type="button" onClick={() => setChain((c) => c.filter((x) => x !== m))} aria-label={"Remove " + m}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="cmp-pop-head">Models</div>
                  {MODELS.map((m) => (
                    <div key={m} className="cmp-chain-row pick">
                      <button type="button" className="cmp-pick" onClick={() => pickModel(m)}>
                        {m}
                      </button>
                      {!chain.includes(m) && (
                        <button type="button" onClick={() => addFallback(m)}>
                          + fallback
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="cmp-chip" onClick={() => setEffort((x) => (x + 1) % EFFORTS.length)}>
              {EFFORTS[effort]}
            </button>
            <button type="button" className="cmp-send" onClick={send} aria-label="Send">
              ↵
            </button>
          </div>
        </div>
        <div className="cmp-foot">
          <span>{AGENT_NOTE[agent]}</span>
          {cacheHint && <span className="cmp-cache">re-reads ~452k tokens</span>}
        </div>
      </div>
    </div>
  );
}
