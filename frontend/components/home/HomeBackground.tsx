"use client";

import { useEffect, useRef } from "react";

type SplineLine = {
  yRatio: number;
  amplitude: number;
  speed: number;
  phase: number;
  chaos: number;
  freq: number;
  stroke: string;
  width: number;
  glow: number;
};

const SPLINE_LINES: SplineLine[] = [
  {
    yRatio: 0.18,
    amplitude: 52,
    speed: 0.42,
    phase: 0,
    chaos: 1.1,
    freq: 0.011,
    stroke: "rgba(255, 255, 255, 0.55)",
    width: 1.4,
    glow: 18,
  },
  {
    yRatio: 0.28,
    amplitude: 68,
    speed: 0.31,
    phase: 1.4,
    chaos: 0.85,
    freq: 0.009,
    stroke: "rgba(120, 210, 200, 0.45)",
    width: 1.2,
    glow: 22,
  },
  {
    yRatio: 0.38,
    amplitude: 44,
    speed: 0.55,
    phase: 2.8,
    chaos: 1.35,
    freq: 0.013,
    stroke: "rgba(30, 70, 120, 0.28)",
    width: 1,
    glow: 10,
  },
  {
    yRatio: 0.48,
    amplitude: 78,
    speed: 0.38,
    phase: 0.6,
    chaos: 1.05,
    freq: 0.008,
    stroke: "rgba(255, 255, 255, 0.35)",
    width: 1.1,
    glow: 16,
  },
  {
    yRatio: 0.58,
    amplitude: 56,
    speed: 0.47,
    phase: 3.5,
    chaos: 1.2,
    freq: 0.012,
    stroke: "rgba(60, 170, 155, 0.38)",
    width: 1.3,
    glow: 20,
  },
  {
    yRatio: 0.68,
    amplitude: 62,
    speed: 0.29,
    phase: 1.9,
    chaos: 0.95,
    freq: 0.01,
    stroke: "rgba(20, 55, 95, 0.22)",
    width: 0.9,
    glow: 8,
  },
  {
    yRatio: 0.78,
    amplitude: 48,
    speed: 0.52,
    phase: 4.2,
    chaos: 1.4,
    freq: 0.014,
    stroke: "rgba(255, 255, 255, 0.28)",
    width: 1,
    glow: 14,
  },
  {
    yRatio: 0.88,
    amplitude: 36,
    speed: 0.36,
    phase: 2.1,
    chaos: 1.15,
    freq: 0.009,
    stroke: "rgba(100, 200, 185, 0.32)",
    width: 1.2,
    glow: 18,
  },
];

function waveY(
  x: number,
  baseY: number,
  t: number,
  line: SplineLine,
  segmentIndex: number
): number {
  const n = segmentIndex * line.chaos;
  return (
    baseY +
    Math.sin(x * line.freq + t * line.speed + line.phase + n) * line.amplitude +
    Math.cos(x * line.freq * 1.7 + t * line.speed * 1.25 + n * 0.6) * line.amplitude * 0.45 +
    Math.sin(t * line.speed * 0.9 + n * 1.3) * line.amplitude * 0.25
  );
}

function drawSpline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  line: SplineLine,
  t: number
) {
  const baseY = height * line.yRatio;
  const segments = 14;
  const step = width / segments;

  ctx.beginPath();
  ctx.moveTo(0, waveY(0, baseY, t, line, 0));

  for (let i = 0; i < segments; i++) {
    const x0 = i * step;
    const x1 = x0 + step * 0.33;
    const x2 = x0 + step * 0.66;
    const x3 = x0 + step;

    const y1 = waveY(x1, baseY, t, line, i + 0.33);
    const y2 = waveY(x2, baseY, t, line, i + 0.66);
    const y3 = waveY(x3, baseY, t, line, i + 1);

    ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
  }

  ctx.strokeStyle = line.stroke;
  ctx.lineWidth = line.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = line.stroke;
  ctx.shadowBlur = line.glow;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function paintLightPools(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
  const pools = [
    { x: 0.15 + Math.sin(t * 0.08) * 0.04, y: 0.12, r: 0.28 },
    { x: 0.78 + Math.cos(t * 0.06) * 0.05, y: 0.22, r: 0.22 },
    { x: 0.45 + Math.sin(t * 0.05) * 0.06, y: 0.55, r: 0.35 },
  ];

  for (const pool of pools) {
    const px = width * pool.x;
    const py = height * pool.y;
    const pr = width * pool.r;
    const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
    g.addColorStop(0, "rgba(255, 255, 255, 0.14)");
    g.addColorStop(0.45, "rgba(160, 220, 210, 0.06)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * Chaotic glowing spline lines — canvas animation with soft light pools.
 */
export function HomeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId = 0;
    let time = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (!reduced) {
        paintLightPools(ctx, width, height, time);
      }

      const t = reduced ? 0 : time;
      for (const line of SPLINE_LINES) {
        drawSpline(ctx, width, height, line, t);
      }

      if (!reduced) {
        time += 0.018;
      }

      frameId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    render();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="home-ambient-bg pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="home-light-veil absolute inset-0" />
      <div className="home-vignette absolute inset-0" />
    </div>
  );
}
