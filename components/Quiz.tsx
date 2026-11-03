"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type PointerEvent } from "react";
import ContactFields, { contactFrom } from "@/components/ContactFields";
import LegalLink from "@/components/LegalLink";
import LevelMeter from "@/components/LevelMeter";
import { order } from "@/components/QuestionStep";
import { submitQuiz, type QuizResult } from "@/lib/api";
import { dims, levels, questions } from "@/lib/assessment";
import { quizQuestions, type QuizAnswers } from "@/lib/quiz";

const TOTAL = quizQuestions.length;
const FULL_TEST_SIZE = questions.length;

/** Пауза после выбора, чтобы человек увидел отмеченную плитку. */
const ADVANCE_MS = 320;

const pad = (n: number) => String(n).padStart(2, "0");

/** S·I·R·E·N·S: буква загорается, когда отвечены все вопросы направления. */
function SirensWord({ answers, dim }: { answers: QuizAnswers; dim: number | null }) {
  return (
    <div className="quiz-word" aria-hidden="true">
      {dims.map((d) => {
        const own = quizQuestions.filter((q) => q.dim === d.id);
        const done = own.filter((q) => q.code in answers).length / own.length;
        return (
          <span
            key={d.id}
            className="quiz-word__dim"
            data-current={d.id === dim ? "1" : "0"}
            data-done={done === 1 ? "1" : "0"}
          >
            <span className="quiz-word__letter">{d.letter}</span>
            <span className="quiz-word__track">
              <span className="quiz-word__fill" style={{ ["--done" as string]: done }} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Подсветка плитки под курсором: координаты — в CSS-переменные. */
function spotlight(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

/**
 * Экспресс-квиз: 10 вопросов → контакты → результат. Горизонтальная панель:
 * слева вопрос и прогресс по буквам SIRENS, справа плитки ответов (клавиши
 * 1–5). Результат показываем сразу и отправляем на почту; в конце —
 * приглашение в кабинет на полный тест.
 */
export default function Quiz({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const q = step < TOTAL ? quizQuestions[step] : null;
  // варианты перемешиваются: код ответа — уровень, а не позиция на экране
  const shown = useMemo(() => (q ? order(q.opts.length, true) : []), [q]);

  const pick = (level: number) => {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.code]: level }));
    // не функциональный апдейт: двойной клик не перескочит через вопрос
    setTimeout(() => setStep(step + 1), ADVANCE_MS);
  };

  useEffect(() => {
    if (!q) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const pos = Number(e.key) - 1;
      if (pos >= 0 && pos < shown.length) pick(q.opts[shown[pos]].l);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const submit = async (form: HTMLFormElement) => {
    setSending(true);
    setError(false);
    try {
      setResult(await submitQuiz(contactFrom(form), answers));
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const restart = () => {
    setAnswers({});
    setResult(null);
    setStep(0);
  };

  if (result) {
    const level = result.level ?? 0;
    const flags = quizQuestions.filter((x) => result.flags?.includes(x.code));
    return (
      <div className="quiz quiz--result">
        <aside className="quiz__aside">
          <span className="quiz__eyebrow">Результат экспресс-оценки</span>
          <div className="quiz__score">
            <span className="quiz__score-num">{result.T}</span>
            <span className="quiz__score-of">/ 100</span>
          </div>
          <span className="quiz__level">{levels[level].name}</span>
          <p className="quiz__aside-note">
            Подробный разбор отправили на&nbsp;<b>{result.contact.email}</b>
          </p>
          <SirensWord answers={answers} dim={null} />
        </aside>
        <div className="quiz__main">
          <h3 className="quiz__title">
            {result.contact.name}, вот ваш уровень культуры безопасности
          </h3>
          <LevelMeter T={result.T} level={level} bare />
          {flags.length > 0 && (
            <div className="quiz__flags">
              <span className="quiz__flags-title">
                Несоответствия обязательным требованиям: {flags.length}
              </span>
              <ul>
                {flags.map((x) => (
                  <li key={x.code}>{x.flag}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="quiz__next">
            <div className="quiz__next-text">
              <span className="quiz__next-title">Это экспресс-версия</span>
              <span className="quiz__next-sub">
                Полный опросник SIRENS&nbsp;— {FULL_TEST_SIZE} вопрос по&nbsp;6&nbsp;направлениям:
                профиль, несоответствия и&nbsp;план действий на&nbsp;90&nbsp;дней.
              </span>
            </div>
            <Link href="/cabinet/register/" className="cta cta--md" onClick={onClose}>
              Пройти полный тест
              <span className="cta__arrow">↗</span>
            </Link>
          </div>
          <button type="button" className="quiz__link" onClick={restart}>
            Пройти экспресс-тест заново
          </button>
        </div>
      </div>
    );
  }

  if (q) {
    const dim = dims[q.dim - 1];
    return (
      <div className="quiz">
        <aside className="quiz__aside">
          <div className="quiz__aside-top">
            <span className="quiz__eyebrow">Экспресс-оценка</span>
            <span className="quiz__count">
              <b>{pad(step + 1)}</b> / {pad(TOTAL)}
            </span>
          </div>
          {/* key — чтобы вопрос заново проявлялся при смене шага */}
          <div className="quiz__q" key={`q${step}`}>
            <div className="quiz__dim">
              <span className="quiz__glyph" aria-hidden="true">
                {dim.letter}
              </span>
              <span className="quiz__dim-name">{dim.name}</span>
            </div>
            <h3 className="quiz__question">{q.text}</h3>
          </div>
          <p className="quiz__hint" key={`h${step}`}>
            <span className="quiz__hint-label">Как&nbsp;проверить</span>
            {q.check}
          </p>
          <SirensWord answers={answers} dim={q.dim} />
        </aside>
        <div className="quiz__main">
          <p className="quiz__prompt">Выберите вариант, который точнее всего описывает практику у&nbsp;вас</p>
          <div className="quiz__tiles" role="radiogroup" aria-label={q.text} key={`t${step}`}>
            {shown.map((i, pos) => {
              const opt = q.opts[i];
              const on = answers[q.code] === opt.l;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className="quiz__tile"
                  data-picked={on ? "1" : "0"}
                  style={{ ["--i" as string]: pos }}
                  onPointerMove={spotlight}
                  onClick={() => pick(opt.l)}
                >
                  <span className="quiz__tile-top">
                    <span className="quiz__tile-num">{pad(pos + 1)}</span>
                    <span className="quiz__tile-mark" aria-hidden="true" />
                  </span>
                  <span className="quiz__tile-text">{opt.t}</span>
                </button>
              );
            })}
          </div>
          <div className="quiz__nav">
            {step > 0 ? (
              <button type="button" className="quiz__back" onClick={() => setStep(step - 1)}>
                ← Назад
              </button>
            ) : (
              <span />
            )}
            <span className="quiz__keys">
              Выбор клавишами <kbd>1</kbd>–<kbd>5</kbd>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className="quiz quiz--contacts"
      onSubmit={(e) => {
        e.preventDefault();
        if (!sending) void submit(e.currentTarget);
      }}
    >
      <aside className="quiz__aside">
        <div className="quiz__aside-top">
          <span className="quiz__eyebrow">Последний шаг</span>
          <span className="quiz__count">
            <b>{pad(TOTAL)}</b> / {pad(TOTAL)}
          </span>
        </div>
        <h3 className="quiz__question">Куда прислать результат?</h3>
        <p className="quiz__aside-note">
          Уровень покажем сразу, а&nbsp;подробный разбор по&nbsp;шести направлениям придёт на&nbsp;почту.
        </p>
        <SirensWord answers={answers} dim={null} />
      </aside>
      <div className="quiz__main">
        <p className="quiz__prompt">Все поля обязательны</p>
        <ContactFields autoFocus />
        <div className="quiz__consents">
          <label className="consent">
            <input type="checkbox" name="consent" required />
            <span>
              Даю <LegalLink doc="consent" className="consent__link">
                согласие на&nbsp;обработку персональных данных
              </LegalLink>{" "}
              в&nbsp;соответствии с&nbsp;<LegalLink doc="privacy" className="consent__link">
                Политикой
              </LegalLink>
            </span>
          </label>
          <label className="consent consent--optional">
            <input type="checkbox" name="marketing" />
            <span>
              Даю <LegalLink doc="mailing" className="consent__link">
                согласие на&nbsp;получение рекламных рассылок
              </LegalLink>{" "}
              и&nbsp;новостей SIRENS
            </span>
          </label>
        </div>
        <div className="quiz__nav">
          <button type="button" className="quiz__back" onClick={() => setStep(TOTAL - 1)}>
            ← Назад
          </button>
          <button type="submit" className="submit" disabled={sending}>
            {sending ? "Считаем…" : "Получить результат"}
            <span className="submit__arrow">↗</span>
          </button>
        </div>
        {error && (
          <p className="form__error" role="alert">
            Не&nbsp;получилось отправить. Попробуйте ещё раз.
          </p>
        )}
      </div>
    </form>
  );
}
