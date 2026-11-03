"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header className={cx("nav", scrolled && "scrolled")}>
      <div className="wrap nav-inner">
        <a href="#top" className="nav-brand" aria-label="Zidane home">
          <Image src="/mark.png" alt="" width={26} height={26} priority />
          <span>Zidane</span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#tour">Tour</a>
          <a href="#features">Features</a>
          <a href="#models">Models</a>
          <a href="https://zidane.si/docs">Docs</a>
        </nav>
        <a className="btn btn-blue btn-sm" href="#install">Install</a>
      </div>
    </header>
  );
}
