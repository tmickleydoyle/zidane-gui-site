"use client";
import { useRef, useState } from "react";
import { cx } from "@/lib/cx";

type Bind = { action: string; keys: string[]; fixed?: boolean };

const BINDS: Bind[] = [
  { action: "Command palette", keys: ["meta+KeyK"] },
  { action: "Settings", keys: ["meta+Comma"] },
  { action: "Toggle sidebar", keys: ["meta+KeyB"] },
  { action: "New session", keys: ["ctrl+KeyN"] },
  { action: "Model picker", keys: ["ctrl+KeyM"] },
  { action: "Reasoning effort", keys: ["ctrl+KeyL"] },
  { action: "Cycle agent", keys: ["shift+meta+KeyI"] },
  { action: "Cancel work", keys: ["ctrl+KeyK"] },
  { action: "Browse messages", keys: ["ctrl+KeyS"] },
  { action: "Todos", keys: ["ctrl+KeyT"] },
  { action: "Usage panel", keys: ["ctrl+KeyP"] },
  { action: "Keybindings list", keys: ["ctrl+KeyY", "shift+Slash"] },
  { action: "Session details", keys: ["ctrl+shift+KeyX"] },
  { action: "Toggle side panel", keys: ["ctrl+shift+KeyA"] },
  { action: "Jump to Main", keys: ["ctrl+shift+KeyM"] },
  { action: "Generate title", keys: ["ctrl+shift+KeyT"] },
  { action: "Compact", keys: ["ctrl+shift+KeyK"] },
  { action: "Export Markdown", keys: ["ctrl+shift+KeyE"] },
  { action: "Export JSON", keys: ["ctrl+shift+KeyJ"] },
  { action: "Delete session", keys: ["ctrl+shift+KeyD"] },
  { action: "Copy session id", keys: ["ctrl+shift+KeyC"] },
  { action: "Next panel", keys: ["ctrl+shift+BracketRight"] },
  { action: "Previous panel", keys: ["ctrl+shift+BracketLeft"] },
  { action: "Next tab", keys: ["alt+meta+ArrowRight"] },
  { action: "Previous tab", keys: ["alt+meta+ArrowLeft"] },
  { action: "Close tab", keys: ["ctrl+KeyW", "meta+KeyW"] },
  { action: "Terminal drawer", keys: ["ctrl+Backquote", "meta+KeyJ"] },
  { action: "New terminal", keys: ["ctrl+shift+Backquote"] },
  { action: "Annotate page", keys: ["meta+Period"] },
  { action: "Split right", keys: ["meta+Backslash"] },
  { action: "Split down", keys: ["alt+meta+Backslash"] },
  { action: "Zoom in", keys: ["meta+Equal"] },
  { action: "Zoom out", keys: ["meta+Minus"] },
  { action: "Reset zoom", keys: ["meta+Digit0"] },
  { action: "Find in conversation", keys: ["meta+KeyF"], fixed: true },
  { action: "Legacy models (in the picker)", keys: ["alt+KeyL"], fixed: true },
];

const CODE_GLYPH: Record<string, string> = {
  Backquote: "\u0060", Backslash: "\\", BracketLeft: "[", BracketRight: "]", Comma: ",", Period: ".",
  Equal: "=", Minus: "−", Slash: "/", ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓",
  Enter: "⏎", Escape: "esc", Space: "␣", Tab: "⇥", Backspace: "⌫",
};
const MOD_GLYPH: Record<string, string> = { ctrl: "⌃", alt: "⌥", shift: "⇧", meta: "⌘" };
const ORDER = ["ctrl", "alt", "shift", "meta"];

function glyph(spec: string) {
  const parts = spec.split("+");
  const code = parts.pop() ?? "";
  const mods = ORDER.filter((m) => parts.includes(m)).map((m) => MOD_GLYPH[m]).join("");
  const key = CODE_GLYPH[code] ?? code.replace(/^Key|^Digit/, "");
  return code === "Slash" && parts.includes("shift") ? "?" : mods + key;
}

function specOf(e: React.KeyboardEvent) {
  const mods = [e.ctrlKey && "ctrl", e.altKey && "alt", e.shiftKey && "shift", e.metaKey && "meta"].filter(Boolean);
  return [...mods, e.code].join("+");
}

const MODIFIER_CODES = /^(Shift|Control|Alt|Meta|OS)(Left|Right)?$/;

export function KeybindingsDemo() {
  const [hit, setHit] = useState<{ spec: string; action: string | null; n: number } | null>(null);
  const [focused, setFocused] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab" || MODIFIER_CODES.test(e.code)) return;
    e.preventDefault();
    const spec = specOf(e);
    const i = BINDS.findIndex((b) => b.keys.includes(spec));
    setHit((h) => ({ spec, action: i >= 0 ? BINDS[i].action : null, n: (h?.n ?? 0) + 1 }));
    const list = listRef.current;
    const el = i >= 0 ? list?.children[i] : null;
    if (list && el instanceof HTMLElement) list.scrollTop = el.offsetTop - list.clientHeight / 2 + el.offsetHeight / 2;
  };

  return (
    <div className="kb">
      <div
        className={cx("kb-pad", focused && "focused")}
        tabIndex={0}
        role="textbox"
        aria-label="Press a Zidane shortcut"
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {hit ? (
          <div key={hit.n} className="kb-hit">
            <span className="kb-combo">{glyph(hit.spec)}</span>
            <span className={cx("kb-action", !hit.action && "miss")}>{hit.action ?? "Not bound by default"}</span>
          </div>
        ) : (
          <span className="kb-idle">{focused ? "Press a shortcut…" : "Click here, then press a shortcut"}</span>
        )}
      </div>
      <ul className="kb-list" ref={listRef}>
        {BINDS.map((b) => (
          <li key={b.action} className={cx(hit?.action === b.action && "on")}>
            <span>{b.action}</span>
            {b.fixed && <span className="kb-fixed">fixed</span>}
            <span className="kb-keys">
              {b.keys.map((k) => (
                <kbd key={k}>{glyph(k)}</kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
