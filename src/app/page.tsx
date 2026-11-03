import Image from "next/image";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Pitch } from "@/components/Pitch";
import { RunDemo } from "@/components/RunDemo";
import { Tour } from "@/components/Tour";
import { ApprovalsDemo } from "@/components/ApprovalsDemo";
import { ContextOrb } from "@/components/ContextOrb";
import { UsageCard } from "@/components/UsageCard";
import { KeybindingsDemo } from "@/components/KeybindingsDemo";
import { CodemodeDemo } from "@/components/CodemodeDemo";
import { FallbackDemo } from "@/components/FallbackDemo";
import { SubagentsDemo } from "@/components/SubagentsDemo";
import { Install } from "@/components/Install";

type Tile = { id: string; title: string; text: string; demo: ReactNode };
const TILES: Tile[] = [
  { id: "kb", title: "Keyboard first.", text: "Over thirty shortcuts, every one of them yours to remap. Press ? any time to see them all.", demo: <KeybindingsDemo /> },
  { id: "cm", title: "Many steps, one turn.", text: "In Codemode the agent writes one small script that runs many steps at once, instead of a slow back-and-forth.", demo: <CodemodeDemo /> },
  { id: "fb", title: "Keeps going when a model stalls.", text: "If a model goes quiet, Zidane retries, then hands the run to the next model on your list.", demo: <FallbackDemo /> },
  { id: "sa", title: "Splits big jobs up.", text: "It sends helpers after separate parts of a task, a few at a time, and brings their results back.", demo: <SubagentsDemo /> },
  { id: "use", title: "Know your habits.", text: "Streaks, busiest hours, favorite model and half a year of activity, right on the welcome screen.", demo: <UsageCard /> },
  { id: "orb", title: "See where your context goes.", text: "A live breakdown of what fills the model's memory, and one key to compact it.", demo: <ContextOrb /> },
];

const SMALL = [
  ["Fork from any message", "Branch a new session from any point in a conversation."],
  ["Queue while it works", "Keep typing. Push a queued message into the running turn."],
  ["Your own commands", "Save prompts you repeat as slash commands, with arguments."],
  ["Bring your setup", "Import conversations, tools, skills and commands from Claude Code."],
  ["Run it on a server", "Keep the agent on a remote machine and attach from your laptop."],
  ["Many windows", "Pop a conversation or its side panels into a window of their own."],
];

const PROVIDERS_A = ["Anthropic", "OpenAI", "Google Gemini", "xAI Grok", "Vertex AI", "OpenRouter", "Mistral"];
const PROVIDERS_B = ["Amazon Bedrock", "Cerebras", "Z.ai", "Arcee", "Baseten", "Neuralwatt", "Local models", "Fireworks", "Groq"];

function Marquee({ items, reverse }: { items: string[]; reverse?: boolean }) {
  return (
    <div className="marquee">
      <div className={"marquee-track" + (reverse ? " reverse" : "")}>
        {[...items, ...items].map((p, i) => (
          <span key={i} className="prov" aria-hidden={i >= items.length || undefined}>
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <main id="top">
        <section className="hero">
          <Pitch />
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="hero-eyebrow">
                <Image src="/mark.png" alt="" width={20} height={20} />
                Zidane for desktop · macOS and Linux
              </span>
              <h1>
                The coding agent that goes <em>straight to the goal.</em>
              </h1>
              <p className="lede">
                Hand it a task and watch it work. It searches, edits, runs your tests and checks with you before anything
                risky, with everything you need in the same window.
              </p>
              <div className="hero-ctas">
                <a className="btn btn-blue" href="#install">Install Zidane</a>
                <a className="btn btn-ghost" href="#tour">Take the tour</a>
              </div>
              <p className="hero-foot">Open source. Works with the models and subscriptions you already have.</p>
            </div>
            <div className="hero-shot">
              <RunDemo />
            </div>
          </div>
        </section>

        <section className="section" id="tour">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">The tour</span>
              <h2 className="h2">One window for the whole job.</h2>
              <p className="lede">Chat, code review, a terminal and a browser, all side by side. Scroll through a session.</p>
            </div>
            <Tour />
          </div>
        </section>

        <section className="section" id="control">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Control</span>
              <h2 className="h2">You approve every change, down to the line.</h2>
              <p className="lede">
                Decide how much freedom it gets: ask before everything, let a careful second model handle the obvious
                calls, or hand over the keys. Edits always show the diff first, and you keep only the parts you like.
              </p>
            </div>
            <ApprovalsDemo />
          </div>
        </section>

        <section className="section" id="features">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Details</span>
              <h2 className="h2">Small things that save whole afternoons.</h2>
              <p className="lede">The features people find in week three. Every tile here is live, so go ahead and play.</p>
            </div>
            <div className="bento">
              {TILES.map((t) => (
                <article key={t.id} className={"tile t-" + t.id}>
                  <div className="tile-copy">
                    <h3>{t.title}</h3>
                    <p>{t.text}</p>
                  </div>
                  <div className="tile-demo">{t.demo}</div>
                </article>
              ))}
              <article className="tile t-more">
                <div className="tile-copy">
                  <h3>And the small stuff.</h3>
                </div>
                <ul className="small-list">
                  {SMALL.map(([title, text]) => (
                    <li key={title}>
                      <b>{title}</b>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="models">
          <div className="wrap">
            <div className="section-head center">
              <span className="eyebrow">Models</span>
              <h2 className="h2">Bring the models you already pay for.</h2>
              <p className="lede">
                Sign in with your Claude, ChatGPT, Grok or Google account, or paste an API key. Mix providers in one backup
                list, or run a model on your own machine.
              </p>
            </div>
          </div>
          <Marquee items={PROVIDERS_A} />
          <Marquee items={PROVIDERS_B} reverse />
        </section>

        <section className="section" id="install">
          <div className="wrap">
            <Install />
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="wrap">
          <span className="footer-brand">
            <Image src="/mark.png" alt="" width={22} height={22} />
            Zidane
          </span>
          <span>Open source, MIT licensed.</span>
          <nav aria-label="Footer">
            <a href="#tour">Tour</a>
            <a href="#features">Features</a>
            <a href="https://zidane.si/docs">Docs</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
