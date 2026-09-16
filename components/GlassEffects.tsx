"use client";

import { useEffect } from "react";

/**
 * Подсветка под курсором и лёгкий наклон стеклянных панелей.
 * Перенесено из логики макета: элементы помечены data-glass="tilt|flat".
 */
export default function GlassEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const panels = Array.from(
      document.querySelectorAll<HTMLElement>("[data-glass]")
    );

    panels.forEach((el) => {
      el.dataset.baseBg =
        el.style.backgroundImage || getComputedStyle(el).backgroundImage;
      el.style.transition =
        "transform .35s cubic-bezier(.2,.7,.3,1), background-image .12s linear";
      el.style.willChange = "transform, background-image";
    });

    let active: HTMLElement | null = null;

    const reset = (el: HTMLElement) => {
      el.style.backgroundImage = el.dataset.baseBg ?? "";
      if (el.dataset.glass === "tilt") el.style.transform = "";
    };

    const onMove = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.<HTMLElement>("[data-glass]") ?? null;
      if (active && active !== el) reset(active);
      if (!el) {
        active = null;
        return;
      }
      active = el;
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.backgroundImage =
        `radial-gradient(340px circle at ${x}% ${y}%, rgba(255,255,255,.34), rgba(255,255,255,.06) 45%, rgba(255,255,255,0) 70%), ` +
        el.dataset.baseBg;
      if (el.dataset.glass === "tilt") {
        const tilt = 4;
        el.style.transform = `perspective(900px) rotateX(${
          ((50 - y) / 50) * tilt
        }deg) rotateY(${((x - 50) / 50) * tilt}deg)`;
      }
    };

    const onLeave = () => {
      if (active) {
        reset(active);
        active = null;
      }
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      panels.forEach(reset);
    };
  }, []);

  return null;
}
