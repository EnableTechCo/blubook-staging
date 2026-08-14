"use client";

import { useEffect } from "react";

const revealSelector = "[data-motion-reveal], [data-motion-reveal-group]";

export function LandingMotion() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion || !("IntersectionObserver" in window)) return;

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

    return () => observer.disconnect();
  }, []);

  return null;
}
