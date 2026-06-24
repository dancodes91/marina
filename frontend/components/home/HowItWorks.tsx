"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ClipboardList, CreditCard, Ship, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Submit your work order",
    description: "Pick winter, spring, or general service. Checklist jobs, attach photos, set your preferred date.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "We review & estimate",
    description: "Service team reviews your request, assigns labor codes, and sends a clear total estimate.",
  },
  {
    icon: Ship,
    step: "03",
    title: "Schedule & service",
    description: "Approved work gets scheduled. Track every status change — under review through in progress.",
  },
  {
    icon: CreditCard,
    step: "04",
    title: "Pay & launch",
    description: "When work is complete, pay online and coordinate pickup or launch on your timeline.",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-step]",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.65,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    }, sectionRef);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-marina-ink py-20 text-white md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 grain opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="section-label mb-3 text-marina-teal">How it works</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            From click to{" "}
            <span className="italic text-marina-teal">launch day</span>
          </h2>
          <p className="mt-4 text-white/65">
            Four steps designed for busy boat owners — no phone tag, no re-entering your hull details.
          </p>
        </div>

        <ol className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.step}
                data-step
                className="group border-t border-white/15 pt-8 transition-colors hover:border-marina-teal/60"
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-4xl font-bold text-white/15">{item.step}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-marina-teal ring-1 ring-white/10 transition-colors group-hover:bg-marina-teal group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{item.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
