"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { marinaConfig } from "@/lib/marina";
import { cn } from "@/lib/utils";
import type { LandingGalleryResponse } from "@/types";

const AUTO_ADVANCE_MS = 6000;
const DEFAULT_SLIDE = "/api/v1/landing-gallery/default";

function resolveSlideUrl(url: string | null | undefined) {
  if (!url) return DEFAULT_SLIDE;
  if (url.startsWith("/api/v1/")) return url;
  if (url.endsWith(".svg")) return DEFAULT_SLIDE;
  return url;
}

function isRemoteUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function HomeCarousel() {
  const [gallery, setGallery] = useState<LandingGalleryResponse>({
    slides: [{ id: null, url: DEFAULT_SLIDE, alt_text: "Marina waterfront" }],
    default_url: DEFAULT_SLIDE,
    using_fallback: true,
    hero_label: marinaConfig.name,
    hero_title: marinaConfig.subtitle,
  });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides =
    gallery.using_fallback || !gallery.slides.length
      ? [{ id: null, url: resolveSlideUrl(gallery.default_url), alt_text: "Marina waterfront" }]
      : gallery.slides.map((slide) => ({ ...slide, url: resolveSlideUrl(slide.url) }));

  const slideCount = slides.length;

  const goTo = useCallback(
    (next: number) => {
      if (slideCount <= 1) return;
      setIndex((next + slideCount) % slideCount);
    },
    [slideCount]
  );

  const heroLabel = gallery.hero_label ?? marinaConfig.name;
  const heroTitle = gallery.hero_title ?? marinaConfig.subtitle;

  useEffect(() => {
    apiFetch<LandingGalleryResponse>("/api/v1/landing-gallery", { token: null })
      .then((data) => {
        if (data.using_fallback || !data.slides.length) {
          setGallery({
            slides: [{ id: null, url: resolveSlideUrl(data.default_url), alt_text: "Marina waterfront" }],
            default_url: resolveSlideUrl(data.default_url),
            using_fallback: true,
            hero_label: data.hero_label ?? marinaConfig.name,
            hero_title: data.hero_title ?? marinaConfig.subtitle,
          });
          return;
        }
        setGallery(data);
      })
      .catch(() => {
        setGallery({
          slides: [{ id: null, url: DEFAULT_SLIDE, alt_text: "Marina waterfront" }],
          default_url: DEFAULT_SLIDE,
          using_fallback: true,
          hero_label: marinaConfig.name,
          hero_title: marinaConfig.subtitle,
        });
      });
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [gallery]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || paused || slideCount <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % slideCount);
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, slideCount]);

  return (
    <section
      className="relative w-full overflow-hidden bg-marina-ink"
      aria-roledescription="carousel"
      aria-label="Marina gallery"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[48vh] min-h-[320px] max-h-[560px] w-full md:h-[58vh]">
        {slides.map((slide, i) => (
          <div
            key={slide.id ?? `default-${i}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.url}
              alt={slide.alt_text ?? `${marinaConfig.name} marina`}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="100vw"
              unoptimized={isRemoteUrl(slide.url) || slide.url.startsWith("/api/v1/")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-marina-ink/70 via-marina-ink/20 to-marina-ink/30" />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 grain opacity-40" />

        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-6 pt-16 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-end justify-between gap-4">
            <div>
              <p className="section-label mb-2 text-marina-teal">{heroLabel}</p>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                {heroTitle}
              </h2>
            </div>

            {slideCount > 1 && (
              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {slideCount > 1 && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id ?? `dot-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
