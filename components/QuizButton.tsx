"use client";

import type { ComponentProps, MouseEvent } from "react";
import { openQuiz } from "@/components/QuizModal";

/**
 * Кнопка «Оценить уровень культуры безопасности»: открывает попап квиза.
 * Без JavaScript остаётся ссылкой на блок диагностики.
 */
export default function QuizButton({ onClick, children, ...rest }: ComponentProps<"a">) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    openQuiz();
  };
  return (
    <a href="#diagnostics" {...rest} onClick={handle}>
      {children}
    </a>
  );
}
