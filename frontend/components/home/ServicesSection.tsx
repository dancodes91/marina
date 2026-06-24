"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Leaf, Snowflake, Wrench } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    formType: "WINTER",
    num: "01",
    icon: Snowflake,
    title: "Winterization",
    description:
      "Engine flush, fuel stabilizer, shrink wrap, and systems blowout — guided checklist so nothing is missed before storage.",
    href: "/requests/new?form_type=WINTER",
    tint: "from-sky-500/20 to-primary/5",
  },
  {
    formType: "SPRING",
    num: "02",
    icon: Leaf,
    title: "Spring commissioning",
    description:
      "De-winterize, fluids, safety checks, and launch prep. Schedule before the rush hits the yard.",
    href: "/requests/new?form_type=SPRING",
    tint: "from-emerald-500/20 to-accent/5",
  },
  {
    formType: "GENERAL",
    num: "03",
    icon: Wrench,
    title: "General service",
    description:
      "Engine, electrical, hull, canvas, and rigging. Describe the issue — we build the estimate from real labor codes.",
    href: "/requests/new?form_type=GENERAL",
    tint: "from-marina-coral/20 to-amber-500/5",
  },
] as const;

export function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-service-head]",
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
      gsap.fromTo(
        "[data-service-card]",
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.14,
          duration: 0.75,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    }, sectionRef);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-service-head className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="section-label mb-3">What we do</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Seasonal & year-round{" "}
              <span className="marina-text-gradient">service forms</span>
            </h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Three work order types with job checklists — the same structure customers expect from
            a full-service river marina.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.formType}
                href={service.href}
                data-service-card
                className={`card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${service.tint} p-8`}
              >
                <span className="text-5xl font-bold text-primary/10">{service.num}</span>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 text-primary shadow-sm ring-1 ring-border/40">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">{service.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <span className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-accent transition-colors group-hover:text-primary">
                  Start request
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
