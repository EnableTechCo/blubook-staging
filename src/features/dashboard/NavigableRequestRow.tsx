"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

const INTERACTIVE_SELECTOR = "a,button,input,select,textarea,label,form";

export function NavigableRequestRow({
  children,
  href,
  label,
}: {
  children: ReactNode;
  href: Route;
  label: string;
}) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
    router.push(href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if ((event.key !== "Enter" && event.key !== " ") || event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    router.push(href);
  }

  return (
    <tr
      aria-label={label}
      className="group cursor-pointer border-b border-ink align-middle transition-colors hover:bg-cobalt-wash/55 focus-visible:bg-cobalt-wash/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cobalt last:border-b-0"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {children}
    </tr>
  );
}
