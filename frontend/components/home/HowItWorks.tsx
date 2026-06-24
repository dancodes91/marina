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
    description: "Pick winter, spring, or general service. Select jobs from our checklist and add photos or notes.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "We review & estimate",
    description: "Our service team reviews your request, assigns labor codes, and sends you a total estimate.",
  },
  {
    icon: Ship,
    step: "03",
    title: "Schedule & service",
    description: "Once approved, we schedule haul-out or dockside work. Track status updates in real time.",
  },
  {
    icon: CreditCard,
    step: "04",
    title: "Pay & launch",
    description: "When work is complete, pay your invoice online and pick up or launch on your timeline.",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-step]", {
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        opacity: 0,
        x: -24,
        stagger: 0.12,
        duration: 0.55,
        ease: "power2.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-marina-sand/50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-primary sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">
            From first click to launch day — a simple four-step process designed for busy boat owners.
          </p>
        </div>
        <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.step} data-step className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl font-bold text-accent/40">{item.step}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-primary">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
