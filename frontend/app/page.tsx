import Link from "next/link";

import { HomeHero } from "@/components/home/HomeHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ServicesSection } from "@/components/home/ServicesSection";
import { MarqueeBand } from "@/components/layout/MarqueeBand";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      <HomeHero />

      <MarqueeBand />

      <ServicesSection />

      <HowItWorks />

      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 marina-gradient opacity-95" />
        <div className="absolute inset-0 grain" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="section-label mb-4 text-marina-teal">Ready when you are</p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your marina, one portal away
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/75">
            Sign in to manage boats and work orders, claim a pre-seeded account, or browse slip and
            storage availability.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-white px-8 text-primary hover:bg-white/90"
            >
              <Link href="/login">Customer portal</Link>
            </Button>
            <Link
              href="/claim"
              className="inline-flex h-11 items-center px-6 text-sm font-semibold text-white underline-offset-4 hover:underline"
            >
              Claim your account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <p>© {new Date().getFullYear()} Rhode River Marina · Service Portal</p>
          <div className="flex gap-6">
            <Link href="/availability" className="transition-colors hover:text-foreground">
              Availability
            </Link>
            <Link href="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
