import Link from "next/link";

import { HomeHero } from "@/components/home/HomeHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ServicesSection } from "@/components/home/ServicesSection";
import { MarinaHeader } from "@/components/layout/MarinaHeader";
import { MarinaPattern } from "@/components/layout/marina-pattern";
import { WaveDivider } from "@/components/layout/WaveDivider";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <MarinaHeader
        title="Rhode River Marina"
        subtitle="Service & storage on the Rhode River"
      >
        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/10">
            <Link href="/availability">Slips & storage</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </MarinaHeader>

      <div className="relative">
        <MarinaPattern className="opacity-50" opacity={0.03} />
        <HomeHero />
      </div>

      <WaveDivider variant="sand" />

      <ServicesSection />

      <WaveDivider variant="navy" flip />

      <HowItWorks />

      <section className="relative overflow-hidden marina-gradient py-16 text-primary-foreground">
        <MarinaPattern className="opacity-30" opacity={0.06} />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-3 text-primary-foreground/80">
            Sign in to manage your boats and work orders, or browse available slips and storage.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">Customer portal</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20"
            >
              <Link href="/claim">Claim your account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20"
            >
              <Link href="/availability">View availability</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Rhode River Marina · Service Portal</p>
      </footer>
    </div>
  );
}
