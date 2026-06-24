"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Leaf, Snowflake, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    formType: "WINTER",
    icon: Snowflake,
    title: "Winterization",
    description:
      "Protect engines, systems, and hulls for cold storage. Select from our winter checklist or add custom notes.",
    href: "/requests/new?form_type=WINTER",
    accent: "from-sky-500/10 to-primary/10",
  },
  {
    formType: "SPRING",
    icon: Leaf,
    title: "Spring commissioning",
    description:
      "De-winterize, service fluids, and get ready for the season. Schedule commissioning before launch day.",
    href: "/requests/new?form_type=SPRING",
    accent: "from-emerald-500/10 to-accent/10",
  },
  {
    formType: "GENERAL",
    icon: Wrench,
    title: "General service",
    description:
      "Engine, electrical, hull, canvas, and more. Describe your issue and our team will provide an estimate.",
    href: "/requests/new?form_type=GENERAL",
    accent: "from-amber-500/10 to-marina-wave/30",
  },
] as const;

export function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-service-card]", {
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        opacity: 0,
        y: 32,
        stagger: 0.15,
        duration: 0.6,
        ease: "power2.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-primary sm:text-4xl">Seasonal & year-round service</h2>
          <p className="mt-3 text-muted-foreground">
            Choose the work order type that fits your needs. Each form includes a guided checklist so nothing is missed.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.formType}
                data-service-card
                className={`relative overflow-hidden border-border/60 bg-gradient-to-br ${service.accent}`}
              >
                <CardHeader>
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-base">{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={service.href}>Start {service.title.toLowerCase()}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
