"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Ambient homepage backdrop: layered gradients + softly drifting SVG shapes (infinite loop).
 */
export function HomeBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !rootRef.current) return;

    const blobs = rootRef.current.querySelectorAll<SVGElement>("[data-blob]");
    const wave = rootRef.current.querySelector<SVGPathElement>("[data-wave-path]");

    const tweens: gsap.core.Tween[] = [];

    blobs.forEach((blob, i) => {
      const t = gsap.to(blob, {
        x: (i % 2 === 0 ? 1 : -1) * (24 + i * 12),
        y: (i % 3 === 0 ? -1 : 1) * (18 + i * 8),
        rotation: i % 2 === 0 ? 8 : -6,
        scale: 1.04 + i * 0.03,
        duration: 9 + i * 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.6,
      });
      tweens.push(t);
    });

    if (wave) {
      tweens.push(
        gsap.fromTo(
          wave,
          { attr: { d: "M0 48 C120 18 240 78 360 48 S600 18 720 48 L720 120 L0 120 Z" } },
          {
            attr: { d: "M0 40 C120 70 240 10 360 40 S600 70 720 40 L720 120 L0 120 Z" },
            duration: 14,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          }
        )
      );
    }

    const shimmer = rootRef.current.querySelector("[data-shimmer]");
    if (shimmer) {
      tweens.push(
        gsap.to(shimmer, {
          xPercent: 120,
          duration: 18,
          repeat: -1,
          ease: "none",
        })
      );
    }

    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="home-ambient-bg pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Soft light shimmer */}
      <div
        data-shimmer
        className="absolute -left-1/3 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-40"
      />

      <svg
        className="absolute -left-[10%] top-[8%] h-[420px] w-[420px] text-primary/10 blur-3xl"
        viewBox="0 0 400 400"
        data-blob
      >
        <circle cx="200" cy="200" r="160" fill="currentColor" />
      </svg>

      <svg
        className="absolute -right-[5%] top-[22%] h-[360px] w-[360px] text-accent/15 blur-3xl"
        viewBox="0 0 400 400"
        data-blob
      >
        <ellipse cx="200" cy="200" rx="170" ry="130" fill="currentColor" />
      </svg>

      <svg
        className="absolute bottom-[18%] left-[30%] h-[280px] w-[280px] text-marina-wave blur-2xl"
        viewBox="0 0 300 300"
        data-blob
      >
        <circle cx="150" cy="150" r="120" fill="currentColor" opacity="0.35" />
      </svg>

      {/* Drifting ring accent */}
      <svg
        className="absolute right-[18%] top-[55%] h-48 w-48 text-accent/20"
        viewBox="0 0 200 200"
        data-blob
      >
        <circle
          cx="100"
          cy="100"
          r="72"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="8 14"
        />
      </svg>

      {/* Bottom wave layer */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] text-primary/[0.07]"
        viewBox="0 0 720 120"
        preserveAspectRatio="none"
        style={{ height: "min(28vh, 220px)" }}
      >
        <path
          data-wave-path
          fill="currentColor"
          d="M0 48 C120 18 240 78 360 48 S600 18 720 48 L720 120 L0 120 Z"
        />
      </svg>
    </div>
  );
}
