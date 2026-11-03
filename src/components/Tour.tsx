"use client";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { PaletteDemo } from "./PaletteDemo";
import { ComposerDemo } from "./ComposerDemo";

function Shot({ name, alt }: { name: string; alt: string }) {
  return (
    <div className="shot">
      <Image src={"/captures/panel-" + name + "-dark.webp"} alt={alt} width={1440} height={900} sizes="(max-width: 1100px) 100vw, 700px" />
    </div>
  );
}

type Step = { id: string; title: string; text: ReactNode; stage: ReactNode };

const STEPS: Step[] = [
  {
    id: "palette",
    title: "Everything is one keystroke away.",
    text: (
      <>
        Press <kbd>⌘K</kbd> to find any action, session, file or setting, and change settings right from the search box. Go
        on, it works on this page.
      </>
    ),
    stage: <PaletteDemo anchorId="tour-palette" />,
  },
  {
    id: "composer",
    title: "Say exactly what you mean.",
    text: (
      <>
        Type <kbd>@</kbd> to point at a file, <kbd>#</kbd> to pull in another chat, <kbd>/</kbd> for a command and{" "}
        <kbd>!</kbd> for a shell line. Switch between Build, Plan and Codemode, and line up backup models.
      </>
    ),
    stage: <ComposerDemo />,
  },
  {
    id: "diffs",
    title: "Review every change as it happens.",
    text: "See what the agent changed, or everything since your last commit. Select a few lines and send a comment straight back into the chat.",
    stage: <Shot name="diffs" alt="Zidane showing a code review panel next to the chat" />,
  },
  {
    id: "browser",
    title: "It sees what it builds.",
    text: "A built-in browser opens your dev server. Point at an element or draw on the page, and the agent knows exactly what you mean.",
    stage: <Shot name="browser" alt="Zidane with a built-in browser showing a weather app" />,
  },
  {
    id: "terminal",
    title: "Share a terminal with it.",
    text: "Open terminals right next to the chat. The agent can read them when you let it, and they keep running after you close the window.",
    stage: <Shot name="terminal" alt="Zidane with a terminal panel open" />,
  },
  {
    id: "inbox",
    title: "Questions wait for you.",
    text: "When the agent needs a decision, it lands in your inbox with clear options. Even from a session you left hours ago.",
    stage: <Shot name="inbox" alt="Zidane asking three questions before opening a pull request" />,
  },
  {
    id: "todos",
    title: "Follow the plan as it goes.",
    text: "The agent keeps a checklist while it works. Tick, edit or add items yourself, and see the pull requests and commits it leaves behind.",
    stage: <Shot name="todos" alt="Zidane showing the agent's checklist" />,
  },
];

const QUERY = "(min-width: 1100px)";
function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useWide() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => true);
}

export function Tour() {
  const wide = useWide();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!wide) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const el of refs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [wide]);

  return (
    <div className={cx("tour", wide ? "wide" : "narrow")}>
      <ol className="tour-steps">
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            id={"tour-" + s.id}
            data-i={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={cx("tour-step", wide && i === active && "on")}
          >
            <span className="tour-n">{String(i + 1).padStart(2, "0")}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            {!wide && <div className="tour-inline">{s.stage}</div>}
          </li>
        ))}
      </ol>
      {wide && (
        <div className="tour-stage-wrap">
          <div className="tour-stage">
            {STEPS.map((s, i) => (
              <div key={s.id} className={cx("tour-scene", i === active && "on")} inert={i !== active}>
                {s.stage}
              </div>
            ))}
          </div>
          <div className="tour-dots" aria-hidden>
            {STEPS.map((s, i) => (
              <i key={s.id} className={cx(i === active && "on")} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
