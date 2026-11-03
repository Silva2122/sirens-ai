"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import QuestionStep, { type StepQuestion } from "@/components/QuestionStep";
import { CalcScreen } from "@/components/cabinet/TestScreens";
import { Pills, Stat, TileTitle } from "@/components/cabinet/Widgets";
import { loadDraft, saveDraft, saveTestResult } from "@/lib/api";
import {
  dims,
  profileQuestions,
  questions,
  type Answer,
  type Answers,
  type Profile,
} from "@/lib/assessment";

/**
 * Шаги опросника: сначала 4 вопроса о компании (на оценку не влияют), потом
 * 31 оценочный. Формат шага собираем один раз — QuestionStep перемешивает
 * варианты при каждом показе, ориентируясь на этот объект.
 */
type Step =
  | { kind: "profile"; id: (typeof profileQuestions)[number]["id"]; group: 0; q: StepQuestion }
  | { kind: "question"; code: string; dim: number; group: number; q: StepQuestion };

const STEPS: Step[] = [
  ...profileQuestions.map((p) => ({
    kind: "profile" as const,
    id: p.id,
    group: 0 as const,
    q: { text: p.text, options: p.opts.map((text) => ({ text })) },
  })),
  ...questions.map((q) => ({
    kind: "question" as const,
    code: q.code,
    dim: q.dim,
    group: q.dim,
    q: {
      text: q.text,
      hint: q.check,
      multi: q.multi,
      na: q.na,
      options: q.opts.map((o) => ({ text: o.t, exclusive: o.x })),
    },
  })),
];

/** Главы: 0 — «О компании», 1–6 — направления SIRENS. */
const GROUPS = [
  { name: "О\u00a0компании", letter: null as string | null, start: 0, count: profileQuestions.length },
  ...dims.map((d) => ({
    name: d.name,
    letter: d.letter as string | null,
    start: STEPS.findIndex((s) => s.group === d.id),
    count: questions.filter((q) => q.dim === d.id).length,
  })),
];

const ADVANCE_MS = 220;

/** Пауза экрана подсчёта: результат сохраняется быстрее, но анимации нужно время. */
const CALC_MS = 3200;

/** 15–18 минут на 35 вопросов — около полуминуты на вопрос. */
const MIN_PER_STEP = 0.5;

/**
 * Опросник внутри кабинета, в раскладке дашборда: четыре показателя
 * прохождения, карточка вопроса, таблетки направлений и «Как проверить».
 */
export default function FullTest() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [profile, setProfile] = useState<Profile>({});
  const [loaded, setLoaded] = useState(false);
  const [calc, setCalc] = useState(false);
  const [error, setError] = useState(false);
  // двойной клик или клавиша во время паузы не должны ответить дважды
  const advancing = useRef(false);
  const finishing = useRef(false);

  // продолжаем с того места, где закрыли вкладку
  useEffect(() => {
    void loadDraft().then((d) => {
      if (d) {
        setAnswers(d.answers);
        setProfile(d.profile);
        setStep(Math.min(d.step, STEPS.length - 1));
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded && !calc) void saveDraft({ answers, profile, step });
  }, [answers, profile, step, loaded, calc]);

  const isAnswered = (i: number) => {
    const s = STEPS[i];
    return s.kind === "question" ? !!answers[s.code] : profile[s.id] !== undefined;
  };
  const answeredIn = (g: (typeof GROUPS)[number]) =>
    Array.from({ length: g.count }, (_, k) => g.start + k).filter(isAnswered).length;
  const answeredTotal = STEPS.filter((_, i) => isAnswered(i)).length;
  /** Дальше первого неотвеченного вопроса прыгать нельзя. */
  const reached = (() => {
    const i = STEPS.findIndex((_, k) => !isAnswered(k));
    return i < 0 ? STEPS.length - 1 : i;
  })();

  const finish = async (all: Answers, prof: Profile) => {
    if (finishing.current) return;
    finishing.current = true;
    setCalc(true);
    setError(false);
    try {
      const [result] = await Promise.all([
        saveTestResult(all, prof),
        new Promise((r) => setTimeout(r, CALC_MS)),
      ]);
      router.replace(`/cabinet/result/?id=${result.id}`);
    } catch {
      setError(true);
      setCalc(false);
      finishing.current = false;
    }
  };

  const answer = (a: Answer) => {
    if (advancing.current) return;
    const cur = STEPS[step];
    const nextAnswers = cur.kind === "question" ? { ...answers, [cur.code]: a } : answers;
    const nextProfile = cur.kind === "profile" ? { ...profile, [cur.id]: a.picked[0] } : profile;
    setAnswers(nextAnswers);
    setProfile(nextProfile);
    advancing.current = true;
    // множественный выбор подтверждён кнопкой «Далее» — паузу не делаем
    setTimeout(
      () => {
        advancing.current = false;
        if (step + 1 < STEPS.length) setStep(step + 1);
        else void finish(nextAnswers, nextProfile);
      },
      cur.q.multi ? 0 : ADVANCE_MS
    );
  };

  if (!loaded) return null;

  const cur = STEPS[step];
  const group = GROUPS[cur.group];
  const value: Answer | undefined =
    cur.kind === "question"
      ? answers[cur.code]
      : profile[cur.id] !== undefined
        ? { picked: [profile[cur.id] as number] }
        : undefined;
  const share = answeredTotal / STEPS.length;
  const minutesLeft = Math.ceil((STEPS.length - answeredTotal) * MIN_PER_STEP);
  const dims6 = GROUPS.slice(1);

  return (
    <div className="board">
      <div className="board__head">
        <div className="board__hello">
          <h1 className="dash__title">Опросник SIRENS</h1>
          <p className="dash__sub">
            {STEPS.length} вопросов, 15–18&nbsp;минут. Прогресс сохраняется&nbsp;— можно закрыть вкладку
            и&nbsp;вернуться.
          </p>
        </div>
        <div className="board__actions">
          <Link href="/cabinet/" className="board__ghost">
            Сохранить и&nbsp;выйти
          </Link>
        </div>
      </div>

      <div className="board__stats">
        <Stat
          label="Пройдено"
          value={`${Math.round(share * 100)}%`}
          foot={`${answeredTotal} из ${STEPS.length} вопросов`}
        >
          <span className="stat__bar">
            <span className="stat__bar-fill" style={{ ["--share" as string]: share }} />
          </span>
        </Stat>
        <Stat label="Направление" value={group.letter ?? "—"} foot={group.letter ? group.name : "Сначала\u00a0— о\u00a0компании"} />
        <Stat
          label="Вопрос"
          value={String(step - group.start + 1)}
          unit={`/ ${group.count}`}
          foot={group.letter ? `В направлении ${group.letter}` : "На\u00a0оценку не\u00a0влияют"}
        />
        <Stat
          label="Осталось"
          value={answeredTotal === STEPS.length ? "0" : `~${minutesLeft}`}
          unit="мин"
          foot="Около полуминуты на&nbsp;вопрос"
        />
      </div>

      <div className="board__grid">
        <section className="tile tile--question">
          {calc ? (
            <CalcScreen questions={questions.length} />
          ) : (
            <>
              <QuestionStep
                key={step}
                index={step}
                total={STEPS.length}
                label={group.letter ? `${group.letter} · ${group.name}` : group.name}
                question={{ ...cur.q, hint: undefined }}
                value={value}
                shuffle={cur.kind === "question"}
                progress={false}
                onAnswer={answer}
                onBack={step > 0 ? () => setStep(step - 1) : undefined}
              />
              <p className="tile__keys" aria-hidden="true">
                Выбор клавишами <kbd>1</kbd>–<kbd>{Math.min(cur.q.options.length + (cur.q.na ? 1 : 0), 9)}</kbd>
                {cur.q.multi && (
                  <>
                    , далее&nbsp;— <kbd>Enter</kbd>
                  </>
                )}
              </p>
              {error && (
                <p className="form__error" role="alert">
                  Не&nbsp;получилось сохранить результат. Ответьте на&nbsp;последний вопрос ещё раз.
                </p>
              )}
            </>
          )}
        </section>

        <section className="tile tile--w4">
          <TileTitle icon="bars">Прохождение по&nbsp;направлениям</TileTitle>
          <Pills
            values={dims6.map((g) => (answeredIn(g) / g.count) * 100)}
            labels={dims6.map((g) => `${answeredIn(g)}/${g.count}`)}
            accent={cur.group > 0 ? cur.group - 1 : null}
            onPick={(i) => {
              const g = dims6[i];
              const first = Array.from({ length: g.count }, (_, k) => g.start + k).find((n) => !isAnswered(n));
              setStep(Math.min(first ?? g.start, reached));
            }}
            locked={(i) => calc || dims6[i].start > reached}
          />
        </section>

        <section className="tile tile--w4">
          <TileTitle icon="search">{cur.kind === "question" ? "Как\u00a0проверить" : "Зачем эти вопросы"}</TileTitle>
          <p className="tile__text">
            {cur.kind === "question"
              ? cur.q.hint
              : "На\u00a0оценку не\u00a0влияют: по\u00a0ним подбираем рекомендации и\u00a0услуги под\u00a0вашу компанию."}
          </p>
        </section>
      </div>
    </div>
  );
}
