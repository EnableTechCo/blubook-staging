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

    const updateHero = () => {
      animationFrame = 0;
      if (!hero || !heroMedia || !heroContent) return;

      const heroRect = hero.getBoundingClientRect();
      const progress = clamp(-heroRect.top / Math.max(heroRect.height * 0.82, 1));

      heroMedia.style.transform = `translate3d(0, ${progress * 44}px, 0) scale(${1.035 + progress * 0.025})`;
      heroContent.style.transform = `translate3d(0, ${progress * -48}px, 0)`;
      heroContent.style.opacity = String(1 - progress * 0.86);
    };

    const requestHeroUpdate = () => {
      if (animationFrame || !hero || !heroMedia || !heroContent) return;
      animationFrame = window.requestAnimationFrame(updateHero);
    };

    updateHero();
    window.addEventListener("scroll", requestHeroUpdate, { passive: true });
    window.addEventListener("resize", requestHeroUpdate);

    if (!("IntersectionObserver" in window)) {
      return () => {
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
      window.removeEventListener("scroll", requestHeroUpdate);
      window.removeEventListener("resize", requestHeroUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return null;
}
