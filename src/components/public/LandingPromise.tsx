"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(Math.max(value, minimum), maximum);

const lerp = (current: number, target: number, factor: number) =>
  current + (target - current) * factor;

type MotionValues = {
  markY: number;
  markRotation: number;
  leftX: number;
  rightX: number;
  shardOpacity: number;
  quoteY: number;
  quoteOpacity: number;
};

export function LandingPromise() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const leftShardRef = useRef<HTMLDivElement>(null);
  const rightShardRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const mark = markRef.current;
    const leftShard = leftShardRef.current;
    const rightShard = rightShardRef.current;
    const quote = quoteRef.current;

    if (!section || !mark || !leftShard || !rightShard || !quote) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      mark.style.transform = "translate3d(-50%, -50%, 0)";
      leftShard.style.transform = "translate3d(0, 0, 0)";
      rightShard.style.transform = "translate3d(0, 0, 0)";
      leftShard.style.opacity = "0.72";
      rightShard.style.opacity = "0.62";
      quote.style.opacity = "1";
      return;
    }

    let frame = 0;
    const current: MotionValues = {
      markY: 120,
      markRotation: -4,
      leftX: -180,
      rightX: 180,
      shardOpacity: 0,
      quoteY: 42,
      quoteOpacity: 0,
    };
    const target: MotionValues = { ...current };

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight, 1);
      const progress = clamp(
        (viewportHeight - rect.top) / (viewportHeight + rect.height),
      );
      const arrival = clamp((progress - 0.04) / 0.28);
      const departure = clamp((0.98 - progress) / 0.18);
      const presence = Math.min(arrival, departure);

      target.markY = 120 - progress * 280;
      target.markRotation = -4 + progress * 8;
      target.leftX = -180 * (1 - presence);
      target.rightX = 180 * (1 - presence);
      target.shardOpacity = presence * 0.72;
      target.quoteY = 42 * (1 - arrival);
      target.quoteOpacity = arrival;

      if (!frame) frame = window.requestAnimationFrame(animate);
    };

    const animate = () => {
      frame = 0;
      current.markY = lerp(current.markY, target.markY, 0.06);
      current.markRotation = lerp(current.markRotation, target.markRotation, 0.06);
      current.leftX = lerp(current.leftX, target.leftX, 0.055);
      current.rightX = lerp(current.rightX, target.rightX, 0.055);
      current.shardOpacity = lerp(current.shardOpacity, target.shardOpacity, 0.055);
      current.quoteY = lerp(current.quoteY, target.quoteY, 0.08);
      current.quoteOpacity = lerp(current.quoteOpacity, target.quoteOpacity, 0.08);

      mark.style.transform = `translate3d(-50%, calc(-50% + ${current.markY}px), 0) rotate(${current.markRotation}deg)`;
      leftShard.style.transform = `translate3d(${current.leftX}px, 0, 0)`;
      rightShard.style.transform = `translate3d(${current.rightX}px, 0, 0)`;
      leftShard.style.opacity = String(current.shardOpacity);
      rightShard.style.opacity = String(current.shardOpacity * 0.86);
      quote.style.transform = `translate3d(0, ${current.quoteY}px, 0)`;
      quote.style.opacity = String(current.quoteOpacity);

      const unsettled = (Object.keys(current) as Array<keyof MotionValues>).some(
        (key) => Math.abs(current[key] - target[key]) > 0.08,
      );
      if (unsettled) frame = window.requestAnimationFrame(animate);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { rootMargin: "20% 0px", threshold: 0.05 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="why-blubook"
      className="public-promise relative isolate flex min-h-screen min-h-[100svh] scroll-mt-0 items-center overflow-hidden text-white"
    >
      <video
        ref={videoRef}
        className="public-promise-video pointer-events-none absolute inset-0"
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source
          src="https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4"
          type="video/mp4"
        />
      </video>
      <div className="public-promise-grid absolute inset-0" aria-hidden="true" />
      <div className="public-promise-light absolute inset-0" aria-hidden="true" />

      <div
        ref={markRef}
        className="public-promise-mark pointer-events-none absolute left-1/2 top-1/2 z-0 w-[min(72vw,760px)]"
        aria-hidden="true"
      >
        <Image
          src="/images/blubook-b-mark.png"
          alt=""
          width={760}
          height={760}
          sizes="(min-width: 1024px) 760px, 72vw"
          className="h-auto w-full"
        />
      </div>

      <div
        ref={leftShardRef}
        className="public-promise-shard public-promise-shard--left pointer-events-none absolute -left-24 bottom-[7%] z-10 hidden h-[54vh] w-[44vw] sm:block"
        aria-hidden="true"
      />
      <div
        ref={rightShardRef}
        className="public-promise-shard public-promise-shard--right pointer-events-none absolute -right-24 bottom-[12%] z-10 hidden h-[48vh] w-[42vw] sm:block"
        aria-hidden="true"
      />

      <div
        ref={quoteRef}
        className="public-promise-copy relative z-20 mx-auto w-full max-w-[980px] px-6 py-28 text-center sm:px-10 lg:px-12"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/58 sm:text-[11px]">
          Why BluBook
        </p>
        <blockquote className="mx-auto mt-7 max-w-[26ch] font-heading text-[1.85rem] font-normal leading-[1.28] tracking-[-0.025em] text-white sm:text-[2.35rem] md:text-[3.05rem] md:leading-[1.24] lg:text-[3.5rem]">
          “The work around a business should feel connected. BluBook brings the people,
          requests, documents, and deadlines into one accountable operating relationship—so
          progress stays visible and the business can keep moving.”
        </blockquote>
        <a
          href="#what-we-do"
          className="public-action public-glass-button mt-9 inline-flex min-h-12 items-center gap-4 rounded-full px-6 py-3 text-[12px] font-semibold tracking-[0.02em] text-white sm:mt-11"
        >
          Explore what we coordinate
          <span className="public-action-arrow" aria-hidden="true">↓</span>
        </a>
      </div>

      <div className="public-promise-handoff pointer-events-none absolute inset-x-0 bottom-0 z-30 h-36" aria-hidden="true" />
    </section>
  );
}
