"use client";

import { useEffect, useRef } from "react";

type VantaEffect = {
  destroy: () => void;
  resize: () => void;
};

export function VantaHeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window.matchMedia !== "function") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactViewport = window.matchMedia("(max-width: 1023px)");

    if (reducedMotion.matches || compactViewport.matches) return;

    let effect: VantaEffect | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let cancelled = false;

    async function initialise() {
      const [threeModule, fogModule] = await Promise.all([
        import("three"),
        import("vanta/dist/vanta.fog.min"),
      ]);

      if (cancelled || !container) return;

      const createFog = fogModule.default;
      effect = createFog({
        el: container,
        THREE: threeModule,
        mouseControls: false,
        touchControls: false,
        gyroControls: false,
        minHeight: 320,
        minWidth: 320,
        highlightColor: 0xdcecff,
        midtoneColor: 0x7eb2f2,
        lowlightColor: 0x2353a5,
        baseColor: 0xf7faff,
        blurFactor: 0.56,
        speed: 0.32,
        zoom: 0.82,
      });

      resizeObserver = new ResizeObserver(() => effect?.resize());
      resizeObserver.observe(container);
    }

    void initialise().catch(() => {
      // The CSS gradient remains as a deliberate fallback if WebGL is unavailable.
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      effect?.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="public-vanta pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
      aria-hidden="true"
    />
  );
}
