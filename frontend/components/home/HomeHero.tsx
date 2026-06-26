"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { marinaConfig } from "@/lib/marina";

gsap.registerPlugin(ScrollTrigger);

export function HomeHero() {
  const rootRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !rootRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(
        "[data-hero='label']",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 }
      )
        .fromTo(
          "[data-hero='line']",
          { opacity: 0, y: 48, rotateX: 12 },
          { opacity: 1, y: 0, rotateX: 0, stagger: 0.08, duration: 0.85 },
          "-=0.35"
        )
        .fromTo(
          "[data-hero='subtitle']",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.65 },
          "-=0.45"
        )
        .fromTo(
          "[data-hero='cta']",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 },
          "-=0.35"
        )
        .fromTo(
          "[data-hero='image']",
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 1 },
          "-=0.7"
        )
        .fromTo(
          "[data-hero='stat']",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.45 },
          "-=0.5"
        );

      if (imageRef.current) {
        gsap.to(imageRef.current, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }
    }, rootRef);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden marina-gradient-soft grain">
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-marina-coral/10 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
        <div className="space-y-8">
          <p data-hero="label" className="section-label">
            {marinaConfig.name} · Service portal
          </p>

          <h1 className="space-y-1 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
            <span data-hero="line" className="block">
              Boat care that
            </span>
            <span data-hero="line" className="block marina-text-gradient">
              moves with you.
            </span>
          </h1>

          <p
            data-hero="subtitle"
            className="max-w-lg text-lg leading-relaxed text-muted-foreground"
          >
            Winterization, spring commissioning, and year-round service — submit work orders,
            track progress, and pay online. Built for owners who are always on the water.
          </p>

          <div className="flex flex-wrap items-center gap-4" data-hero="cta">
            <Button asChild size="lg" className="btn-primary-glow rounded-full px-8">
              <Link href="/login">
                Open customer portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="/availability"
              className="text-sm font-semibold text-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              Browse slips & storage
            </Link>
          </div>

          <dl className="grid grid-cols-3 gap-6 border-t border-border/60 pt-8">
            {[
              { value: "40+", label: "Years on the river" },
              { value: "24h", label: "Review turnaround" },
              { value: "100%", label: "Online tracking" },
            ].map((stat) => (
              <div key={stat.label} data-hero="stat">
                <dt className="text-2xl font-bold text-primary lg:text-3xl">{stat.value}</dt>
                <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div data-hero="image" className="relative w-full lg:ml-auto">
          <div
            ref={imageRef}
            className="relative aspect-[4/3] animate-float overflow-hidden rounded-2xl shadow-2xl shadow-primary/15 ring-1 ring-border/40"
          >
            <Image
              src="/wallace-office.webp"
              alt={`${marinaConfig.name} office and waterfront`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-marina-ink/50 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-sm font-medium text-white/90">{marinaConfig.name}</p>
              <p className="text-xs text-white/70">Service, storage & slip management</p>
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 -z-10 h-full w-full rounded-2xl bg-accent/20" />
        </div>
      </div>
    </section>
  );
}
