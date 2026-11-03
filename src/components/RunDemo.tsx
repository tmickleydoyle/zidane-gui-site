"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cx, isTyping } from "@/lib/cx";
import { useInView } from "@/lib/useInView";

const PROMPT = "Retry failed requests in fetchJson, with backoff.";
const ANSWER = " now retries server errors up to three times, waiting 400, 800 and 1600 ms. Client errors still fail at once.";
const DENIED = "Left src/http/fetch.ts untouched. Switch to Plan with ⇧⌘I and I'll propose the change instead.";

type Decision = "a" | "s" | "p" | "d";
const DECISION_LABEL: Record<Decision, string> = { a: "allowed once", s: "allowed for this session", p: "always allowed", d: "denied" };

/*
  Phases: 0 idle, 1 typing, 2 thinking, 3 grep, 4 parallel reads, 5 settle,
  6 waiting on approval, 7 applying, 8 tests, 9 settle, 10 streaming, 11 done,
  20 streaming the refusal, 21 done after deny.
*/
const STEP_MS: Record<number, number> = { 2: 800, 3: 900, 4: 1100, 5: 450, 7: 600, 8: 1400, 9: 450 };
const AUTO_ALLOW_S = 8;

function nextPhase(p: number) {
  if (p === 5) return 6;
  if (p === 7) return 8;
  return p + 1;
}

function fmtTime(sec: number) {
  const s = Math.floor(sec);
  if (s < 60) return s + "s";
  return Math.floor(s / 60) + "m " + String(s % 60).padStart(2, "0") + "s";
}

function Status({ state }: { state: "run" | "ok" | "no" }) {
  return <span className={"status " + state} aria-hidden>{state === "ok" ? "✓" : state === "no" ? "✕" : null}</span>;
}

export function RunDemo() {
  const [ref, inView] = useInView<HTMLDivElement>(0.35);
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState(0);
  const [shown, setShown] = useState(0);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [tick, setTick] = useState(0);
  const [work, setWork] = useState(0);
  const [wait, setWait] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const running = phase >= 2 && phase !== 11 && phase !== 21;
  const denied = decision === "d";

  // Start once the window scrolls into view.
  useEffect(() => {
    if (!inView || phase !== 0) return;
    const t = window.setTimeout(() => setPhase(1), 500);
    return () => window.clearTimeout(t);
  }, [inView, phase]);

  // Type the prompt into the composer.
  useEffect(() => {
    if (phase !== 1) return;
    const id = window.setInterval(() => {
      setTyped((n) => {
        if (n >= PROMPT.length) {
          window.clearInterval(id);
          window.setTimeout(() => setPhase(2), 350);
          return n;
        }
        return n + 1;
      });
    }, 30);
    return () => window.clearInterval(id);
  }, [phase]);

  // Timed steps.
  useEffect(() => {
    const ms = STEP_MS[phase];
    if (!ms) return;
    const t = window.setTimeout(() => setPhase((p) => (p === phase ? nextPhase(p) : p)), ms);
    return () => window.clearTimeout(t);
  }, [phase]);

  // Stream the final message.
  useEffect(() => {
    if (phase !== 10 && phase !== 20) return;
    const text = phase === 10 ? ANSWER : DENIED;
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          window.clearInterval(id);
          setPhase((p) => (p === phase ? p + 1 : p));
          return n;
        }
        return Math.min(text.length, n + 3);
      });
    }, 22);
    return () => window.clearInterval(id);
  }, [phase]);

  // Run chip counters.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      if (phase !== 6) setWork((w) => w + 1);
      else setWait((s) => s + 1);
    }, 100);
    return () => window.clearInterval(id);
  }, [running, phase]);

  const decide = (d: Decision) => {
    if (phase !== 6) return;
    setDecision(d);
    setPhase(d === "d" ? 20 : 7);
  };

  // Demo auto-allows so a passive visitor still sees the whole run.
  useEffect(() => {
    if (phase !== 6 || wait < AUTO_ALLOW_S * 10) return;
    const t = window.setTimeout(() => {
      setDecision("a");
      setPhase((p) => (p === 6 ? 7 : p));
    }, 0);
    return () => window.clearTimeout(t);
  }, [phase, wait]);

  // Keyboard answers for the approval card.
  useEffect(() => {
    if (!inView || phase !== 6) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const k = e.key.toLowerCase();
      if (k === "a" || k === "s" || k === "p" || k === "d") {
        e.preventDefault();
        setDecision(k);
        setPhase(k === "d" ? 20 : 7);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inView, phase]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [phase, shown]);

  const replay = () => {
    setTyped(0);
    setShown(0);
    setDecision(null);
    setTick(0);
    setWork(0);
    setWait(0);
    setPhase(1);
  };

  const elapsed = tick * 0.42;
  const input = 1800 + work * 118;
  const output = Math.round(work * 7.6);
  const cost = input * 0.000003 + output * 0.000015;
  const rate = work > 0 ? 38 + (work % 7) : 0;
  const tokens = ((input + output) / 1000).toFixed(1) + "k";

  const edited = phase >= 7 && !denied;
  const done = phase === 11 || phase === 21;
  const workLabel =
    phase === 6 ? "Waiting for you" : phase === 2 || phase === 9 || phase === 5 ? "Waiting for the model" : "Working";

  return (
    <div ref={ref}>
      <div className="app" role="img" aria-label="Zidane Desktop running a task: it searches, reads files in parallel, asks before editing, runs tests and reports back.">
        <div className="app-bar">
          <span className="lights" aria-hidden>
            <i /> <i /> <i />
          </span>
          <span className="app-crumbs">
            weather <span>/</span> <b>{phase >= 2 ? "Retry failed requests" : "New session"}</b>
          </span>
          {(running || done) && (
            <span className={cx("run-chip", done && "done")}>
              {running ? <span className="status run sm" /> : <span className="dot-ok" />}
              <span>{fmtTime(elapsed)}</span>
              <span className="sep">·</span>
              <span>{tokens}</span>
              <span className="sep hide-sm">·</span>
              <span className="hide-sm">{rate} tok/s</span>
              <span className="sep">·</span>
              <span>{"~$" + cost.toFixed(3)}</span>
            </span>
          )}
        </div>
        <div className="app-body">
          <aside className="app-side" aria-hidden>
            <div className="side-row">＋ New session</div>
            <div className="side-search">Search sessions</div>
            <div className="side-proj">⑂ weather</div>
            <div className={cx("side-row", "on")}>
              {running ? <span className="status run sm" /> : <span className={done ? "dot-ok" : "dot-idle"} />}
              <span>{phase >= 2 ? "Retry failed requests" : "New session"}</span>
              <span className="side-time">now</span>
            </div>
            <div className="side-row"><span className="dot-idle" /> Draft the v2 notes</div>
            <div className="side-row"><span className="dot-idle" /> Pick a release branch</div>
            <div className="side-foot">
              <span>⌘B</span>
              <span>⚙</span>
            </div>
          </aside>
          <div className="app-main">
            <div className="app-scroll" ref={scrollRef}>
              {phase < 2 && (
                <div className="app-empty">
                  <Image src="/mark.png" alt="" width={36} height={36} />
                  <span>What should we build?</span>
                </div>
              )}
              {phase >= 2 && (
                <div className="msg-user">
                  <span className="avatar">◉</span>
                  <span className="bubble">{PROMPT}</span>
                </div>
              )}
              {phase >= 3 && (
                <div className="tool-row">
                  <Status state={phase === 3 ? "run" : "ok"} />
                  <code>grep</code> <span>&quot;fetchJson&quot; in src</span>
                  {phase > 3 && <span className="tool-res">3 matches · 2 files</span>}
                </div>
              )}
              {phase >= 4 && (
                <>
                  <div className="tool-row">
                    <Status state={phase === 4 ? "run" : "ok"} />
                    <code>read_file</code> <span>src/http/fetch.ts</span>
                    <span className="par">∥ 2 in parallel</span>
                  </div>
                  <div className="tool-row">
                    <Status state={phase === 4 ? "run" : "ok"} />
                    <code>read_file</code> <span>src/sleep.ts</span>
                  </div>
                </>
              )}
              {phase === 6 && (
                <div className="approval" role="group" aria-label="Approve the edit">
                  <div className="approval-head">
                    <span className="dot-warn" />
                    <code>edit</code>
                    <span>src/http/fetch.ts</span>
                    <span className="approval-stat"><i className="plus">+5</i> <i className="minus">−1</i></span>
                  </div>
                  <div className="diff">
                    <div className="del"><span className="ln">18</span><span className="sign">-</span>  const res = await fetch(url, init)</div>
                    <div className="add"><span className="ln">18</span><span className="sign">+</span>  let res = await fetch(url, init)</div>
                    <div className="add"><span className="ln">19</span><span className="sign">+</span>  for (let attempt = 0; res.status &gt;= 500 &amp;&amp; attempt &lt; 3; attempt++) {"{"}</div>
                    <div className="add"><span className="ln">20</span><span className="sign">+</span>    await sleep(400 * 2 ** attempt)</div>
                    <div className="add"><span className="ln">21</span><span className="sign">+</span>    res = await fetch(url, init)</div>
                    <div className="add"><span className="ln">22</span><span className="sign">+</span>{"  }"}</div>
                    <div><span className="ln">23</span><span className="sign"> </span>  if (!res.ok) throw new HttpError(res)</div>
                  </div>
                  <div className="approval-actions">
                    <button type="button" className="abtn primary" onClick={() => decide("a")}>Allow <kbd>a</kbd></button>
                    <button type="button" className="abtn" onClick={() => decide("s")}>Allow for session <kbd>s</kbd></button>
                    <button type="button" className="abtn" onClick={() => decide("p")}>Always allow <kbd>p</kbd></button>
                    <button type="button" className="abtn danger" onClick={() => decide("d")}>Deny <kbd>d</kbd></button>
                    <span className="auto-note">auto-allows in {Math.max(0, AUTO_ALLOW_S - Math.floor(wait / 10))}s</span>
                  </div>
                </div>
              )}
              {phase >= 7 && decision && (
                <div className="tool-row">
                  <Status state={denied ? "no" : phase === 7 ? "run" : "ok"} />
                  <code>edit</code> <span>src/http/fetch.ts</span>
                  <span className={cx("tool-res", denied && "bad")}>{DECISION_LABEL[decision]}</span>
                </div>
              )}
              {phase >= 8 && !denied && (
                <div className="tool-row">
                  <Status state={phase === 8 ? "run" : "ok"} />
                  <code>shell</code> <span>bun test fetch</span>
                  {phase > 8 && <span className="tool-res good">14 pass · 0 fail</span>}
                </div>
              )}
              {(phase >= 10 && phase <= 11) && (
                <div className="answer">
                  <span className="avatar">▣</span>
                  <div>
                    <p>
                      <code>fetchJson</code>
                      {ANSWER.slice(0, shown)}
                      {phase === 10 && <span className="caret" />}
                    </p>
                    {phase === 11 && (
                      <div className="receipt">
                        <span className="m">Opus 5.5</span>
                        <span>{fmtTime(elapsed)}</span>
                        <span>↻3</span>
                        <span>{"$" + cost.toFixed(2)}</span>
                        <span>↑{(input / 1000).toFixed(1)}k ↓{output}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {phase >= 20 && (
                <div className="answer">
                  <span className="avatar">▣</span>
                  <div>
                    <p>
                      {DENIED.slice(0, shown)}
                      {phase === 20 && <span className="caret" />}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {running && (
              <div className="work-row">
                <span className={cx("status", phase === 6 ? "wait" : "run", "sm")} />
                <span>{workLabel}</span>
                <span className="work-hint">⌃K cancels</span>
              </div>
            )}
            <div className="composer">
              <div className={cx("composer-text", phase !== 1 && "placeholder")}>
                {phase === 1 ? (
                  <>
                    {PROMPT.slice(0, typed)}
                    <span className="caret" />
                  </>
                ) : running ? (
                  "Queue a message…"
                ) : (
                  "Chat with Zidane…"
                )}
              </div>
              <div className="composer-row">
                <span className="chip-plain">＋</span>
                <span className="chip">Build</span>
                <span className="chip model">Opus 5.5 +1</span>
                <span className={cx("send", running && "busy")} />
              </div>
            </div>
            <div className="gitbar">
              <span>⑂ main</span>
              {edited && (
                <span className="gitbar-right">
                  <i className="plus">+5</i> <i className="minus">−1</i> · 1 file
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="demo-foot">
        <button type="button" className="btn btn-ghost btn-sm" onClick={replay} disabled={phase === 1}>
          ↻ Replay
        </button>
        <span>
          Press <kbd>a</kbd> <kbd>s</kbd> <kbd>p</kbd> or <kbd>d</kbd> when it asks.
        </span>
      </div>
    </div>
  );
}
