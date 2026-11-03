"use client";

import { useEffect, useState } from "react";
import Quiz from "@/components/Quiz";

/** Событие, по которому попап квиза открывается из любой кнопки. */
export const QUIZ_EVENT = "sirens:quiz";

export function openQuiz() {
  window.dispatchEvent(new CustomEvent(QUIZ_EVENT));
}

/**
 * Попап с экспресс-квизом. Монтируется один раз в page.tsx, как попап заявки.
 * Esc и крестик закрывают; клик по фону — нет, чтобы случайно не потерять
 * ответы посреди теста. Каждое открытие начинает квиз с начала.
 */
export default function QuizModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(QUIZ_EVENT, onOpen);
    return () => window.removeEventListener(QUIZ_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="bio bio--quiz" role="dialog" aria-modal="true" aria-label="Экспресс-тест">
      <div className="bio__panel bio__panel--quiz">
        <button
          type="button"
          className="bio__close"
          aria-label="Закрыть"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        <Quiz onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}
