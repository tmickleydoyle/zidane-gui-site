"use client";
import Image from "next/image";
import { useState } from "react";
import { cx } from "@/lib/cx";
import { CopyIcon, useCopy } from "./CopyPill";

const CMD = "npm install -g zidane-gui";
const ICONS = [
  ["midnight-blue", "Midnight blue"],
  ["midnight-blue-grainy", "Midnight grain"],
  ["cobalt-blue", "Cobalt"],
  ["modern", "Modern"],
  ["light", "Light"],
  ["smooth-chrome", "Chrome"],
  ["smooth-chrome-sticker", "Chrome sticker"],
  ["holographic-chrome", "Holographic"],
  ["smooth-holographic-chrome", "Soft holographic"],
  ["smooth-holographic-chrome-sticker", "Holo sticker"],
] as const;

export function Install() {
  const [icon, setIcon] = useState(0);
  const { copied, copy } = useCopy();
  return (
    <div className="band">
      <div className="band-copy">
        <h2 className="band-title">Put Zidane on your desktop.</h2>
        <p className="band-text">One command installs the app and adds it to your launcher. Sign in with the model you already use and give it its first task.</p>
        <button type="button" className="band-cmd" onClick={() => copy(CMD)} aria-label={"Copy " + CMD}>
          <span className="band-prompt">$</span>
          <span>{CMD}</span>
          <span className="band-copy-state">{copied ? "Copied" : <CopyIcon />}</span>
        </button>
        <div className="band-ctas">
          <a className="btn btn-white" href="https://zidane.si/docs/desktop">Read the docs</a>
        </div>
        <p className="band-small">macOS and Linux</p>
      </div>
      <div className="band-icon">
        <div className="band-icon-big">
          <Image key={icon} src={"/app-icons/" + ICONS[icon][0] + ".png"} alt={ICONS[icon][1] + " app icon"} width={160} height={160} />
        </div>
        <div className="band-icons" role="radiogroup" aria-label="Dock icon">
          {ICONS.map(([id, label], i) => (
            <button key={id} type="button" role="radio" aria-checked={i === icon} aria-label={label} title={label} className={cx("band-icon-btn", i === icon && "on")} onClick={() => setIcon(i)}>
              <Image src={"/app-icons/" + id + ".png"} alt="" width={40} height={40} />
            </button>
          ))}
        </div>
        <p className="band-small">Pick your dock icon. There are ten.</p>
      </div>
    </div>
  );
}
