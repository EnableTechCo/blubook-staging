import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingMotion } from "@/components/public/LandingMotion";

// The landing motion runs entirely on DOM nodes rather than React state, so the
// thing worth testing is what it does to the page during scroll — specifically
// that it stops doing anything once the hero has left the viewport. A parallax
// that keeps reading layout at the footer is invisible, which is exactly why it
// survived unnoticed.

type ObserverEntry = { isIntersecting: boolean; target: Element };

let observers: Array<{
  callback: (entries: ObserverEntry[]) => void;
  targets: Element[];
  options?: IntersectionObserverInit;
  disconnected: boolean;
}>;

let rectReads: number;
let frameQueue: Map<number, FrameRequestCallback>;
let nextFrameId: number;

/** Runs every frame currently queued, the way a real vsync tick would. */
const flushFrames = () => {
  const queued = [...frameQueue.entries()];
  frameQueue.clear();
  for (const [, cb] of queued) cb(0);
};

const setupHero = () => {
  document.body.innerHTML = `
    <section data-motion-hero>
      <div data-motion-hero-media></div>
      <video></video>
      <div data-motion-hero-content></div>
    </section>
  `;
};

/** Fires the observer whose target is the hero section. */
const setHeroVisible = (visible: boolean) => {
  const hero = document.querySelector("[data-motion-hero]")!;
  for (const observer of observers) {
    if (observer.targets.includes(hero)) {
      observer.callback([{ isIntersecting: visible, target: hero }]);
    }
  }
};

beforeEach(() => {
  observers = [];
  rectReads = 0;

  vi.stubGlobal(
    "IntersectionObserver",
    class {
      callback: (entries: ObserverEntry[]) => void;
      targets: Element[] = [];
      options?: IntersectionObserverInit;
      disconnected = false;

      constructor(callback: (entries: ObserverEntry[]) => void, options?: IntersectionObserverInit) {
        this.callback = callback;
        this.options = options;
        observers.push(this);
      }
      observe(target: Element) {
        this.targets.push(target);
      }
      unobserve() {}
      disconnect() {
        this.disconnected = true;
      }
    },
  );

  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;

  // Count layout reads and run scheduled frames synchronously so a scroll can
  // be observed end to end inside one test.
  Element.prototype.getBoundingClientRect = function () {
    rectReads += 1;
    return { top: 0, height: 800, width: 1200, bottom: 800, left: 0, right: 1200, x: 0, y: 0, toJSON() {} };
  } as Element["getBoundingClientRect"];

  // Queue frames rather than running them inline. A synchronous stub would run
  // the callback before the caller stored the handle, which real rAF never does
  // and which would wedge the component's own "already scheduled" guard.
  frameQueue = new Map();
  nextFrameId = 1;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextFrameId++;
    frameQueue.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frameQueue.delete(id);
  });

  // jsdom implements neither, and logs a loud "Not implemented" for each call.
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();

  setupHero();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("LandingMotion", () => {
  it("drives the hero parallax while the hero is on screen", () => {
    render(<LandingMotion />);
    setHeroVisible(true);

    const media = document.querySelector<HTMLElement>("[data-motion-hero-media]")!;
    flushFrames();
    rectReads = 0;
    window.dispatchEvent(new Event("scroll"));
    flushFrames();

    expect(rectReads).toBeGreaterThan(0);
    expect(media.style.transform).toContain("translate3d");
  });

  it("stops reading layout on scroll once the hero has left the viewport", () => {
    render(<LandingMotion />);
    setHeroVisible(true);
    window.dispatchEvent(new Event("scroll"));
    flushFrames();

    setHeroVisible(false);
    rectReads = 0;
    for (let i = 0; i < 20; i += 1) {
      window.dispatchEvent(new Event("scroll"));
      flushFrames();
    }

    // This is the regression that matters: scrolling anywhere below the hero
    // used to force a layout and a style write on every single event.
    expect(rectReads).toBe(0);
  });

  it("pauses the hero video off screen and resumes it on return", () => {
    const video = document.querySelector<HTMLVideoElement>("video")!;
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();
    video.play = play;
    video.pause = pause;

    render(<LandingMotion />);

    setHeroVisible(false);
    expect(pause).toHaveBeenCalled();

    setHeroVisible(true);
    expect(play).toHaveBeenCalled();
  });

  it("marks the hero active only while visible, which is what carries will-change", () => {
    render(<LandingMotion />);
    const hero = document.querySelector<HTMLElement>("[data-motion-hero]")!;

    setHeroVisible(true);
    expect(hero.dataset.motionHero).toBe("active");

    setHeroVisible(false);
    expect(hero.dataset.motionHero).toBe("idle");
  });

  it("does nothing at all when the visitor asks for reduced motion", () => {
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    render(<LandingMotion />);
    rectReads = 0;
    window.dispatchEvent(new Event("scroll"));
    flushFrames();

    expect(rectReads).toBe(0);
    expect(observers).toHaveLength(0);
  });

  it("disconnects its observers when unmounted", () => {
    const { unmount } = render(<LandingMotion />);
    expect(observers.length).toBeGreaterThan(0);

    unmount();
    expect(observers.every((observer) => observer.disconnected)).toBe(true);
  });
});
