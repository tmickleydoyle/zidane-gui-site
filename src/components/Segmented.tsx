"use client";
import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";

export type SegOption<T extends string> = { value: T; label: ReactNode };

export function Segmented<T extends string>(props: {
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  compact?: boolean;
  dark?: boolean;
  fill?: boolean;
}) {
  const { options, value, onChange, label, compact, dark, fill } = props;
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const style = { "--count": options.length, "--index": index } as CSSProperties;
  return (
    <div role="radiogroup" aria-label={label} className={cx("seg", compact && "compact", dark && "dark", fill && "fill")} style={style}>
      <span className="seg-chosen" aria-hidden />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={cx("seg-btn", o.value === value && "on")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
