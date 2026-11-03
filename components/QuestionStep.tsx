"use client";

import { useEffect, useMemo, useState, type PointerEvent } from "react";
import type { Answer } from "@/lib/assessment";

export type StepOption = { text: string; exclusive?: boolean };

export type StepQuestion = {
  text: string;
  /** подсказка «Как проверить» */
  hint?: string;
  multi?: boolean;
  options: StepOption[];
  /** вариант «неприменимо» — вопрос исключается из расчёта */
  na?: string | null;
};

/** Порядок показа вариантов. Перемешиваем при каждом показе вопроса: уровень
 *  хранится в данных, а не в позиции на экране. */
export function order(n: number, shuffle: boolean): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (!shuffle) return idx;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/** Варианты выбираются цифрами 1–9 или буквами русской раскладки по порядку. */
const LETTERS = "абвгдежзи";

/** Подсветка под курсором — как у плиток экспресс-квиза. */
function spotlight(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

/**
 * Один вопрос опросника в кабинете: прогресс, текст, варианты (у экспресс-квиза
 * своя раскладка плитками, отсюда он берёт только order). Одиночный выбор
 * сразу отдаёт ответ (дальше ведёт onAnswer); множественный — по кнопке
 * «Далее». Взаимоисключающий вариант снимает
 * остальные, любой другой снимает его.
 */
export default function QuestionStep({
  index,
  total,
  label,
  question,
  value,
  shuffle = false,
  progress,
  onAnswer,
  onBack,
}: {
  index: number;
  total: number;
  /** над вопросом: «Экспресс-тест», «О компании» или направление */
  label: string;
  question: StepQuestion;
  value?: Answer;
  shuffle?: boolean;
  /** своя полоса прогресса вместо стандартной */
  progress?: React.ReactNode;
  onAnswer: (answer: Answer) => void;
  onBack?: () => void;
}) {
  const shown = useMemo(() => order(question.options.length, shuffle), [question, shuffle]);
  const [picked, setPicked] = useState<number[]>(value?.na ? [] : (value?.picked ?? []));
  const [na, setNa] = useState(!!value?.na);
  const pad = (n: number) => String(n).padStart(2, "0");

  const toggle = (i: number) => {
    if (!question.multi) {
      setPicked([i]);
      setNa(false);
      onAnswer({ picked: [i] });
      return;
    }
    setNa(false);
    setPicked((cur) => {
      if (cur.includes(i)) return cur.filter((x) => x !== i);
      if (question.options[i].exclusive) return [i];
      return [...cur.filter((x) => !question.options[x].exclusive), i];
    });
  };

  const pickNa = () => {
    setPicked([]);
    setNa(true);
    if (!question.multi) onAnswer({ picked: [], na: true });
  };

  const canSubmit = picked.length > 0 || na;
  const submit = () => onAnswer(na ? { picked: [], na: true } : { picked });

  // Клавиатура: 1–9 или А–И — вариант по позиции на экране, Enter — «Далее».
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "Enter" && question.multi && canSubmit) {
        e.preventDefault();
        submit();
        return;
      }
      const key = e.key.toLowerCase();
      const pos = /^[1-9]$/.test(key) ? Number(key) - 1 : LETTERS.indexOf(key);
      if (pos < 0) return;
      if (pos < shown.length) toggle(shown[pos]);
      else if (pos === shown.length && question.na) pickNa();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="qstep">
      <div className="qstep__top">
        <span className="qstep__label">{label}</span>
        <span className="qstep__count">
          {pad(index + 1)} / {pad(total)}
        </span>
      </div>
      {progress ?? (
        <div className="qstep__progress" aria-hidden="true">
          <span className="qstep__bar" style={{ ["--progress" as string]: index / total }} />
        </div>
      )}
      <h3 className="qstep__text">{question.text}</h3>
      {question.hint && (
        <p className="qstep__hint">
          <span className="qstep__hint-label">Как&nbsp;проверить</span>
          {question.hint}
        </p>
      )}
      {question.multi && <p className="qstep__multi">Можно выбрать несколько вариантов</p>}
      <div
        className="qstep__options"
        role={question.multi ? "group" : "radiogroup"}
        aria-label={question.text}
      >
        {shown.map((i, pos) => {
          const on = picked.includes(i);
          return (
            <button
              key={i}
              type="button"
              role={question.multi ? "checkbox" : "radio"}
              aria-checked={on}
              className="qstep__option"
              data-picked={on ? "1" : "0"}
              data-multi={question.multi ? "1" : "0"}
              style={{ ["--i" as string]: pos }}
              onPointerMove={spotlight}
              onClick={() => toggle(i)}
            >
              <span className="qstep__num">{pad(pos + 1)}</span>
              <span className="qstep__opt-text">{question.options[i].text}</span>
              <span className="qstep__mark" aria-hidden="true" />
            </button>
          );
        })}
        {question.na && (
          <button
            type="button"
            role={question.multi ? "checkbox" : "radio"}
            aria-checked={na}
            className="qstep__option qstep__option--na"
            data-picked={na ? "1" : "0"}
            data-multi={question.multi ? "1" : "0"}
            style={{ ["--i" as string]: shown.length }}
            onPointerMove={spotlight}
            onClick={pickNa}
          >
            <span className="qstep__num">{pad(shown.length + 1)}</span>
            <span className="qstep__opt-text">{question.na}</span>
            <span className="qstep__mark" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="qstep__nav">
        {onBack ? (
          <button type="button" className="qstep__back" onClick={onBack}>
            ← Назад
          </button>
        ) : (
          <span />
        )}
        {question.multi && (
          <button
            type="button"
            className="cta cta--md qstep__next"
            disabled={!canSubmit}
            onClick={submit}
          >
            Далее
            <span className="cta__arrow">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
