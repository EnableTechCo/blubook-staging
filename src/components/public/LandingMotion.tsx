"use client";

import { useEffect } from "react";

const revealSelector = "[data-motion-reveal], [data-motion-reveal-group], [data-motion-line]";

export function LandingMotion() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const hero = document.querySelector<HTMLElement>("[data-motion-hero]");
    const heroHandoff = document.querySelector<HTMLElement>("[data-motion-hero-handoff]");

    if (reducedMotion) return;

    let animationFrame = 0;

    const updateHeroHandoff = () => {
      animationFrame = 0;
      if (!hero || !heroHandoff) return;

      const travel = Math.max(window.innerHeight * 0.64, 1);
      const progress = Math.min(Math.max(-hero.getBoundingClientRect().top / travel, 0), 1);

      heroHandoff.style.opacity = String(0.18 + progress * 0.72);
      heroHandoff.style.transform = `translate3d(0, ${(1 - progress) * 24}px, 0)`;
    };

    const requestHeroHandoffUpdate = () => {
      if (animationFrame || !hero || !heroHandoff) return;
      animationFrame = window.requestAnimationFrame(updateHeroHandoff);
    };

    updateHeroHandoff();
    window.addEventListener("scroll", requestHeroHandoffUpdate, { passive: true });
    window.addEventListener("resize", requestHeroHandoffUpdate);

    if (!("IntersectionObserver" in window)) {
      return () => {
        window.removeEventListener("scroll", requestHeroHandoffUpdate);
        window.removeEventListener("resize", requestHeroHandoffUpdate);
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
      window.removeEventListener("scroll", requestHeroHandoffUpdate);
      window.removeEventListener("resize", requestHeroHandoffUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return null;
}
