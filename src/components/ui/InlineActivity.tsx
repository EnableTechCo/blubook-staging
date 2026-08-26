"use client";

import { useEffect, useState } from "react";

export function InlineActivity({ label, compact = false }: { label: string; compact?: boolean }) {
  const [deciseconds, setDeciseconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setDeciseconds((value) => value + 1), 100);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = (deciseconds / 10).toFixed(1);

  return (
    <span className="workspace-activity" role="status" aria-live="polite">
      <span className="workspace-activity__grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} style={{ animationDelay: `${(index % 3 + Math.abs(Math.floor(index / 3) - 1)) * 90}ms` }} />
        ))}
      </span>
      <span className="workspace-activity__label">{label}</span>
      {!compact ? <span className="workspace-activity__time">{elapsed}s</span> : null}
    </span>
  );
}
