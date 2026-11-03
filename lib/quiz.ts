/**
 * Экспресс-квиз на лендинге — демо-версия оценки SIRENS: 10 вопросов Д1–Д10
 * из «SIRENS_демо_коды_результатов.xlsx». Тексты не дублируем: заказчик взял
 * их из полного опросника дословно, поэтому берём вопросы из
 * lib/assessment-spec.json по коду. Отличие от полного теста — в каждом
 * вопросе один вариант, его уровень 0–4 и есть код ответа.
 */

import { dims, levelIndexFor, questions } from "@/lib/assessment";

/** Коды вопросов Д1…Д10 в полной версии, порядок — как в демо. */
const QUIZ_CODES = ["1.1", "1.2", "2.1", "2.3", "3.1", "3.4", "4.1", "5.2", "6.1", "6.2"];

export const quizQuestions = QUIZ_CODES.map((code) => {
  const q = questions.find((x) => x.code === code);
  if (!q) throw new Error(`Нет вопроса ${code} в спецификации`);
  return q;
});

/** Ответы: код вопроса → уровень выбранного варианта (0–4). */
export type QuizAnswers = Record<string, number>;

export type QuizScore = {
  /** итоговая оценка 0–100 */
  T: number;
  /** уровень с учётом ограничения: при несоответствиях не выше «Сирены» */
  level: number;
  /** коды вопросов с несоответствием обязательным требованиям */
  flags: string[];
};

/**
 * Расчёт как в листе «Калькулятор»: оценка направления — среднее уровней его
 * вопросов, приведённое к сотне; T — сумма оценок с весами направлений.
 * Несоответствие — уровень 0 в вопросе с флагом (Д3, Д4, Д6, Д9). Если оно
 * есть и T ≥ 60, уровень ограничен «Сиреной».
 */
export function quizScore(answers: QuizAnswers): QuizScore {
  const level = (code: string) => answers[code] ?? 0;
  const D = dims.map((d) => {
    const own = quizQuestions.filter((q) => q.dim === d.id);
    return (own.reduce((s, q) => s + level(q.code), 0) / (4 * own.length)) * 100;
  });
  const T = Math.round(dims.reduce((s, d, i) => s + d.weight * D[i], 0));
  const flags = quizQuestions.filter((q) => q.flag && level(q.code) === 0).map((q) => q.code);
  const byT = levelIndexFor(T);
  return { T, level: flags.length > 0 && byT > 2 ? 2 : byT, flags };
}
