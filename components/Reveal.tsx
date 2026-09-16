"use client";

import { useEffect } from "react";

/**
 * Что анимируем при скролле. Список дублирует селектор скрытого состояния в
 * app/globals.css (блок «Появление при скролле») — менять оба места вместе.
 * Первый экран сюда не входит: его текст ведёт скролл-сцена и прелоадер.
 */
const SCOPES = [
  ".why",
  ".services",
  ".philosophy",
  ".diagnostics",
  ".team",
  ".contacts",
  ".footer",
];

const TARGETS = [
  ".eyebrow",
  ".section-title",
  ".philosophy__title",
  ".lede",
  ".trigger",
  ".group",
  ".step",
  ".member",
  ".contact",
  ".form",
  ".footer__top",
  ".footer__meta",
];

const SELECTOR = SCOPES.flatMap((s) => TARGETS.map((t) => `${s} ${t}`)).join(", ");

/** Лесенка для того, что входит в экран одновременно: шаг и потолок ступеней. */
const STEP_MS = 70;
const MAX_STEPS = 5;

/**
 * Появление текста и карточек при скролле. Каждый элемент анимируется один
 * раз. Стартуем только после прелоадера, чтобы то, что уже в экране, не
 * отыграло анимацию под шторкой.
 */
export default function Reveal() {
  useEffect(() => {
    const html = document.documentElement;
    // класс ставит ранний скрипт; при «уменьшить движение» его нет
    if (!html.classList.contains("reveal-ready")) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));

    const io = new IntersectionObserver(
      (entries) => {
        const incoming = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top ||
              a.boundingClientRect.left - b.boundingClientRect.left
          );
        incoming.forEach((e, i) => {
          const el = e.target as HTMLElement;
          el.style.setProperty(
            "--reveal-delay",
            `${Math.min(i, MAX_STEPS) * STEP_MS}ms`
          );
          el.classList.add("is-in");
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    const start = () => els.forEach((el) => io.observe(el));
    if (html.classList.contains("is-loaded")) start();
    else window.addEventListener("sirens:loaded", start, { once: true });

    return () => {
      io.disconnect();
      window.removeEventListener("sirens:loaded", start);
    };
  }, []);

  return null;
}
