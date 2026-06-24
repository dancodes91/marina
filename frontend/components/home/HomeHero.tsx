"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

export function HomeHero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !rootRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero='badge']", { opacity: 0, y: 16, duration: 0.5 })
        .from("[data-hero='title']", { opacity: 0, y: 24, duration: 0.6 }, "-=0.2")
        .from("[data-hero='subtitle']", { opacity: 0, y: 20, duration: 0.5 }, "-=0.3")
        .from("[data-hero='cta']", { opacity: 0, y: 16, stagger: 0.12, duration: 0.45 }, "-=0.2")
        .from("[data-hero='image']", { opacity: 0, scale: 0.96, duration: 0.7 }, "-=0.4");

      gsap.from("[data-hero='stat']", {
        scrollTrigger: { trigger: rootRef.current, start: "top 80%" },
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.5,
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <div className="space-y-6">
          <p
            data-hero="badge"
            className="inline-flex rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent"
          >
            Rhode River Marina · Service Portal
          </p>
          <h2
            data-hero="title"
            className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-[3.25rem] lg:leading-tight"
          >
            Expert boat care,{" "}
            <span className="marina-text-gradient">on your schedule</span>
          </h2>
          <p data-hero="subtitle" className="max-w-xl text-lg text-muted-foreground">
            Submit winterization, spring commissioning, and year-round service requests online.
            Track progress, view estimates, and pay invoices — all in one place.
          </p>
          <div className="flex flex-wrap gap-3" data-hero="cta">
            <Button asChild size="lg" variant="accent">
              <Link href="/login">
                Customer sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/requests/new?form_type=WINTER">
                <Calendar className="h-4 w-4" />
                Start work order
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { value: "40+", label: "Years on the water" },
              { value: "24h", label: "Typical review time" },
              { value: "100%", label: "Online tracking" },
            ].map((stat) => (
              <div key={stat.label} data-hero="stat" className="text-center sm:text-left">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div
          data-hero="image"
          className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/20 via-marina-wave/40 to-accent/20 shadow-xl"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="rounded-full bg-white/60 p-6 backdrop-blur-sm">
              <svg viewBox="0 0 64 64" className="h-16 w-16 text-primary" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M8 44 L32 20 L56 44 L48 44 L48 52 L16 52 L16 44 Z M28 36 L36 36 L36 48 L28 48 Z"
                  opacity="0.3"
                />
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M4 48 Q32 28 60 48"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-primary/80">Marina hero image placeholder</p>
            <p className="text-xs text-muted-foreground">Replace with waterfront photography</p>
          </div>
        </div>
      </div>
    </section>
  );
}
