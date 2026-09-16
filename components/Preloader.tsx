"use client";

import { useEffect, useRef, useState } from "react";

const WORD = ["S", "I", "R", "E", "N", "S", ".", "A", "I"];

/** Минимум показа — чтобы успело проявиться слово; потолок ожидания загрузки. */
const MIN_MS = 1600;
const MAX_MS = 3500;
/** Сколько идёт уход шторки вверх. */
const LEAVE_MS = 1100;

type Phase = "loading" | "leaving" | "done";

/**
 * Прелоадер: пульсирующий маячок, слово SIRENS.AI побуквенно из-под маски,
 * счётчик и волосяная линия прогресса. Прогресс честный — ждёт шрифты и
 * событие load, но не дольше MAX_MS. На выходе маячок вспыхивает, экран
 * уезжает вверх, на <html> ставится is-loaded — от него стартует анимация
 * первого экрана и появление текста при скролле.
 */
export default function Preloader() {
  const [phase, setPhase] = useState<Phase>("loading");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const countRef = useRef<HTMLSpanElement | null>(null);
  const fillRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    // сигнал раннему скрипту в layout: React ожил, аварийный сброс не нужен
    (window as Window & { __sirensBoot?: boolean }).__sirensBoot = true;

    const html = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const min = reduced ? 400 : MIN_MS;
    const start = performance.now();

    let loaded = false;
    let finished = false;
    let p = 0;
    let raf = 0;
    let leaveTimer = 0;

    const markLoaded = () => {
      loaded = true;
    };
    const pageReady =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) =>
            window.addEventListener("load", () => resolve(), { once: true })
          );
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    Promise.all([pageReady, fontsReady]).then(markLoaded, markLoaded);
    const capTimer = window.setTimeout(markLoaded, MAX_MS);

    const finish = () => {
      if (finished) return;
      finished = true;
      // фазу ставим прямо в DOM до снятия is-preloading, иначе на кадр
      // прелоадер пропадёт, не начав уезжать
      if (rootRef.current) rootRef.current.dataset.phase = "leaving";
      html.classList.remove("is-preloading");
      html.classList.add("is-loaded");
      window.dispatchEvent(new Event("sirens:loaded"));
      setPhase("leaving");
      leaveTimer = window.setTimeout(
        () => setPhase("done"),
        reduced ? 300 : LEAVE_MS
      );
    };

    const tick = () => {
      const t = performance.now() - start;
      const ready = loaded && t >= min;
      // пока ждём — асимптотически к 90%, после готовности — быстро к 100%
      const target = ready ? 1 : 0.9 * (1 - Math.exp(-t / 900));
      p += (target - p) * (ready ? 0.16 : 0.07);
      if (ready && p > 0.995) p = 1;

      if (countRef.current) {
        countRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;

      if (p === 1) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(capTimer);
      window.clearTimeout(leaveTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div className="preloader" data-phase={phase} ref={rootRef} aria-hidden="true">
      <div className="preloader__center">
        <div className="preloader__beacon">
          <span className="preloader__ring" />
          <span className="preloader__ring preloader__ring--late" />
          <span className="preloader__flash" />
          <span className="preloader__dot" />
        </div>
        <div className="preloader__word">
          {WORD.map((ch, i) => (
            <span
              key={i}
              className={
                ch === "." ? "preloader__char preloader__char--dot" : "preloader__char"
              }
              style={{ ["--i" as string]: i }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
      <div className="preloader__foot">
        <span className="preloader__count" ref={countRef}>
          000
        </span>
        <span className="preloader__bar">
          <span className="preloader__fill" ref={fillRef} />
        </span>
        <span className="preloader__caption">Мы слышим риск раньше</span>
      </div>
    </div>
  );
}
