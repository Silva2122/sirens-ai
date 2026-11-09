"use client";

import type { ComponentProps, MouseEvent } from "react";
import { openQuiz } from "@/components/QuizModal";
import { CABINET_ENABLED } from "@/lib/features";

/**
 * Кнопка «Оценить уровень культуры безопасности»: открывает попап квиза.
 * Без JavaScript остаётся ссылкой на блок диагностики. На боевом сайте
 * квиза нет (lib/features.ts) — кнопка ведёт к форме заявки.
 */
export default function QuizButton({ onClick, children, ...rest }: ComponentProps<"a">) {
  if (!CABINET_ENABLED) {
    return (
      <a href="#contacts" {...rest} onClick={onClick}>
        {children}
      </a>
    );
  }
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
