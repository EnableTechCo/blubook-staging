"use client";

import { useEffect } from "react";

const revealSelector =
  "[data-motion-reveal], [data-motion-reveal-group], [data-motion-line], [data-motion-section]";

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(Math.max(value, minimum), maximum);

export function LandingMotion() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const hero = document.querySelector<HTMLElement>("[data-motion-hero]");
    const heroMedia = document.querySelector<HTMLElement>("[data-motion-hero-media]");
    const heroContent = document.querySelector<HTMLElement>("[data-motion-hero-content]");

    if (reducedMotion) return;

    let animationFrame = 0;
    // The parallax only means anything while the hero is on screen. Without this
    // gate every scroll anywhere on the page — including the footer — still read
    // the hero's box and wrote three style properties, which is a forced layout
    // and a paint for something nobody can see.
    let heroActive = true;

    const updateHero = () => {
      animationFrame = 0;
      if (!hero || !heroMedia || !heroContent || !heroActive) return;

      const heroRect = hero.getBoundingClientRect();
      const progress = clamp(-heroRect.top / Math.max(heroRect.height * 0.82, 1));

      heroMedia.style.transform = `translate3d(0, ${progress * 44}px, 0) scale(${1.035 + progress * 0.025})`;
      heroContent.style.transform = `translate3d(0, ${progress * -48}px, 0)`;
      heroContent.style.opacity = String(1 - progress * 0.86);
    };

    const requestHeroUpdate = () => {
      if (animationFrame || !hero || !heroMedia || !heroContent || !heroActive) return;
      animationFrame = window.requestAnimationFrame(updateHero);
    };

    updateHero();
    window.addEventListener("scroll", requestHeroUpdate, { passive: true });
    window.addEventListener("resize", requestHeroUpdate);

    // Decoding a 1080p loop while the reader is at the footer costs power for
    // nothing, so the hero video follows the hero in and out of view. The
    // `data-motion-hero` state also carries the will-change hint in CSS.
    const heroVideo = hero?.querySelector<HTMLVideoElement>("video") ?? null;
    let heroObserver: IntersectionObserver | undefined;

    // `play()` predates its own promise: older Safari returns undefined, and so
    // does jsdom. Wrapping keeps a rejected autoplay from becoming a TypeError.
    const resumeHeroVideo = () => {
      if (!heroVideo) return;
      void Promise.resolve(heroVideo.play()).catch(() => undefined);
    };

    if (hero && "IntersectionObserver" in window) {
      heroObserver = new IntersectionObserver(
        ([entry]) => {
          heroActive = entry.isIntersecting;
          hero.dataset.motionHero = heroActive ? "active" : "idle";
          if (heroActive) {
            requestHeroUpdate();
            resumeHeroVideo();
          } else {
            heroVideo?.pause();
            if (animationFrame) {
              window.cancelAnimationFrame(animationFrame);
              animationFrame = 0;
            }
          }
        },
        { threshold: 0 },
      );
      heroObserver.observe(hero);
    } else if (hero) {
      hero.dataset.motionHero = "active";
    }

    if (!("IntersectionObserver" in window)) {
      return () => {
        heroObserver?.disconnect();
        window.removeEventListener("scroll", requestHeroUpdate);
        window.removeEventListener("resize", requestHeroUpdate);
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.motionState = "visible";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );

    for (const element of elements) {
      const alreadyVisible = element.getBoundingClientRect().top < window.innerHeight * 0.88;
      element.dataset.motionState = alreadyVisible ? "visible" : "pending";
      if (!alreadyVisible) observer.observe(element);
    }

    return () => {
      observer.disconnect();
      heroObserver?.disconnect();
      window.removeEventListener("scroll", requestHeroUpdate);
      window.removeEventListener("resize", requestHeroUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return null;
}
