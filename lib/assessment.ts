import rawSpec from "@/lib/assessment-spec.json";
import { typo, typoDeep } from "@/lib/typo";

/**
 * Опросник SIRENS (31 вопрос, 6 направлений) и расчёт результата по
 * «Методологии SIRENS: уровень культуры безопасности», версия 2.
 * Вопросы и все тексты результата — в lib/assessment-spec.json, это копия
 * спецификации заказчика без правок: тексты выводятся дословно, {переменные}
 * подставляются здесь. Свериться с расчётом можно по control_examples в ней же.
 * При загрузке во всех строках расставляются неразрывные пробелы (lib/typo.ts):
 * слова не меняются, строки просто не рвутся после предлогов.
 */

const spec = typoDeep(rawSpec);

export type SpecOption = { l: number; t: string; x: boolean };

export type SpecQuestion = {
  code: string;
  dim: number;
  text: string;
  check: string;
  multi: boolean;
  max: number;
  flag: string | null;
  na: string | null;
  action: string;
  opts: SpecOption[];
};

export type ProfileQuestion = { id: ProfileId; text: string; opts: string[] };
export type ProfileId = "p1" | "p2" | "p3" | "p4";

export const dims = spec.dims;
export const levels = spec.levels;
export const texts = spec.texts;
export const questions = spec.questions as SpecQuestion[];
export const profileQuestions = spec.profile as ProfileQuestion[];

/** Ключи направлений в directions и conclusion.weak — по порядку dims.
 *  Вторая S (самокоррекция) в спецификации записана как C. */
export const DIR_KEYS = ["S", "I", "R", "E", "N", "C"] as const;

/** Ответ на вопрос: индексы выбранных вариантов в порядке спецификации
 *  (не в порядке на экране — там варианты перемешаны) или «неприменимо». */
export type Answer = { picked: number[]; na?: boolean };
export type Answers = Record<string, Answer>;
/** Профиль компании: id вопроса → индекс варианта. На оценку не влияет. */
export type Profile = Partial<Record<ProfileId, number>>;

const ROLE_OWNER = 0;
const ROLE_OT = 2;
const ACCIDENT_FATAL = 2;
const FORMAL_HIGH = 30;
const SKEW_DIFF = 40;
const EVEN_DIFF = 5;
const PRIORITY_MAX_SCORE = 2.5;
const PRIORITIES = 3;
const SERVICE_CARDS = 2;

// --- подстановка текстов ------------------------------------------------------

/** Индекс формы для русских числительных: 1 яблоко, 2 яблока, 5 яблок. */
function pluralIndex(n: number): 0 | 1 | 2 {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 0;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 1;
  return 2;
}

/**
 * {key} → значение, {форма|формы|форм} → по числу n. В спецификации есть и
 * двухформенные варианты: «1–2: {несоответствие|несоответствия}» и
 * «3+: {несоответствия|несоответствий}» — для них берём формы со сдвигом,
 * несоответствий в опроснике не больше семи.
 */
export function fill(template: string, vars: Record<string, string | number> = {}, n?: number): string {
  // после подстановки число и слово («55 баллов») тоже не должны разрываться
  return typo(template.replace(/\{([^{}]+)\}/g, (whole, key: string) => {
    if (key.includes("|")) {
      if (n === undefined) return whole;
      const forms = key.split("|");
      const i = pluralIndex(n);
      return forms.length === 3 ? forms[i] : forms[Math.max(0, i - (n >= 3 ? 1 : 0))] ?? forms[0];
    }
    return key in vars ? String(vars[key]) : whole;
  }));
}

// --- расчёт -------------------------------------------------------------------

export function levelIndexFor(T: number): number {
  return Math.max(0, levels.findIndex((l) => T >= l.range[0] && T <= l.range[1]));
}

/** Балл вопроса 0–4 или null, если ответа нет или «неприменимо». Множественный
 *  выбор — среднее уровней; вопрос с максимумом меньше 4 нормируется к 4. */
export function questionScore(q: SpecQuestion, a: Answer | undefined): number | null {
  if (!a || a.na || !a.picked.length) return null;
  const avg = a.picked.reduce((s, i) => s + q.opts[i].l, 0) / a.picked.length;
  return q.max < 4 ? (avg * 4) / q.max : avg;
}

/** Несоответствие — выбран вариант уровня 0 в вопросе с обязательным требованием. */
export function isFlagged(q: SpecQuestion, a: Answer | undefined): boolean {
  return !!q.flag && !!a && !a.na && a.picked.some((i) => q.opts[i].l === 0);
}

/**
 * Следующий шаг — вариант на уровень выше текущего, но не ниже уровня 2:
 * переход к формальному выполнению целью не считается. На максимуме — нет.
 */
export function nextStep(q: SpecQuestion, a: Answer | undefined): SpecOption | null {
  if (!a || a.na || !a.picked.length) return null;
  const current = Math.floor(a.picked.reduce((s, i) => s + q.opts[i].l, 0) / a.picked.length);
  const target = Math.max(2, current + 1);
  return [...q.opts].sort((x, y) => x.l - y.l).find((o) => o.l >= target) ?? null;
}

export type QuestionResult = {
  q: SpecQuestion;
  score: number | null;
  flagged: boolean;
  next: SpecOption | null;
};

export type Priority = QuestionResult & { weight: number };

export type Assessment = {
  /** итоговая оценка 0–100 */
  T: number;
  /** индекс уровня в levels с учётом ограничения */
  level: number;
  capped: boolean;
  levelKey: "L0" | "L1" | "L2" | "L3" | "L4" | "CAP";
  /** баллы направлений 0–100, по порядку dims */
  D: number[];
  imax: number;
  imin: number;
  diff: number;
  even: boolean;
  skew: boolean;
  /** доля ответов на уровнях 0–4, проценты */
  dist: number[];
  /** индекс формализма — доля уровня 1 */
  formal: number;
  flags: QuestionResult[];
  priorities: Priority[];
  perQuestion: QuestionResult[];
};

export function assess(answers: Answers): Assessment {
  const perQuestion: QuestionResult[] = questions.map((q) => ({
    q,
    score: questionScore(q, answers[q.code]),
    flagged: isFlagged(q, answers[q.code]),
    next: nextStep(q, answers[q.code]),
  }));

  const rawD = dims.map((d) => {
    const scored = perQuestion.filter((r) => r.q.dim === d.id && r.score !== null);
    if (!scored.length) return 0;
    return (scored.reduce((s, r) => s + (r.score ?? 0), 0) / (4 * scored.length)) * 100;
  });
  const D = rawD.map(Math.round);
  const T = Math.round(dims.reduce((s, d, i) => s + d.weight * rawD[i], 0));

  const flags = perQuestion.filter((r) => r.flagged);
  const byT = levelIndexFor(T);
  const capped = flags.length > 0 && byT > 2;
  const level = capped ? 2 : byT;

  const imax = D.indexOf(Math.max(...D));
  const imin = D.indexOf(Math.min(...D));
  const diff = D[imax] - D[imin];

  // структура: каждый выбранный вариант вносит долю 1/k; уровни вопроса с
  // максимумом 3 приводятся к шкале 0–4, как и балл (контрольный пример B)
  const counts = [0, 0, 0, 0, 0];
  let answered = 0;
  for (const q of questions) {
    const a = answers[q.code];
    if (!a || a.na || !a.picked.length) continue;
    answered += 1;
    for (const i of a.picked) counts[Math.round((q.opts[i].l * 4) / q.max)] += 1 / a.picked.length;
  }
  const dist = counts.map((c) => (answered ? Math.round((c / answered) * 100) : 0));

  const priorities = perQuestion
    .filter((r) => r.score !== null && r.score <= PRIORITY_MAX_SCORE)
    .map((r) => ({
      ...r,
      weight: (4 - (r.score ?? 0)) * dims[r.q.dim - 1].weight * (r.flagged ? 2 : 1),
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, PRIORITIES);

  return {
    T,
    level,
    capped,
    levelKey: capped ? "CAP" : (`L${byT}` as Assessment["levelKey"]),
    D,
    imax,
    imin,
    diff,
    even: diff < EVEN_DIFF,
    skew: diff >= SKEW_DIFF,
    dist,
    formal: dist[1],
    flags,
    priorities,
    perQuestion,
  };
}

// --- тексты результата -------------------------------------------------------

/** LOW 0–39, MID 40–59, HIGH 60–100. */
const group = (score: number) => (score < 40 ? "LOW" : score < 60 ? "MID" : "HIGH");

function roleKey(p3: number | undefined) {
  if (p3 === ROLE_OWNER) return "OWNER (p3=0)";
  if (p3 === ROLE_OT) return "OT (p3=2)";
  return "OTHER (p3=1,3)";
}

/** Блок 0 — заключение под оценкой, абзацы в порядке conclusion.order. */
export function conclusion(r: Assessment, profile: Profile): string[] {
  const c = spec.conclusion;
  const weakKey = r.even
    ? `EVEN_${r.capped ? "MID" : group(r.T)}`
    : `${DIR_KEYS[r.imin]}_${group(r.D[r.imin])}`;
  const n = r.flags.length;
  const out = [
    fill(c.level[r.levelKey], { T: r.T }),
    c.weak[weakKey as keyof typeof c.weak],
    n === 0 ? c.flags["0"] : fill(n <= 2 ? c.flags["1–2"] : c.flags["3+"], { n }, n),
    fill(r.formal >= FORMAL_HIGH ? c.formal["≥30%"] : c.formal["<30%"], { N: r.formal }),
  ];
  if (profile.p4 === ACCIDENT_FATAL) out.push(c.fatal);
  out.push(c.role[roleKey(profile.p3) as keyof typeof c.role]);
  return out;
}

/** Блок 1 — что означает уровень, последствия, главная задача на 90 дней. */
export function portrait(r: Assessment) {
  return spec.level_portraits[r.levelKey];
}

/** Блок 2 — фраза под профилем направлений. */
export function profileText(r: Assessment): string[] {
  const out = [
    r.even
      ? texts.b2_even
      : fill(texts.b2_strong_weak, {
          imax_name_lower: dims[r.imax].name_lower,
          imin_name_lower: dims[r.imin].name_lower,
        }),
  ];
  if (r.skew) out.push(fill(texts.b2_skew, { diff: r.diff }, r.diff));
  return out;
}

/** Блок 2а — расшифровка направления по его баллу. */
export function direction(i: number, D: number) {
  return spec.directions[DIR_KEYS[i]].levels[levelIndexFor(D)];
}

/** Блок 5 — дорожная карта на 90 дней. */
export function roadmap(r: Assessment): [string, string, string] {
  const hasPri = r.priorities.length > 0;
  return [
    r.flags.length
      ? fill(texts.b5_road_1_flags, { codes: r.flags.map((f) => f.q.code).join(", ") })
      : hasPri
        ? texts.b5_road_1_pri
        : texts.b5_road_1_none,
    hasPri ? texts.b5_road_2_pri : texts.b5_road_2_none,
    texts.b5_road_3,
  ];
}

export type ServiceCard = { id: string; name: string; text: string };

/** Блок 6 — до двух услуг по правилам; если набралось меньше двух, добавляется экспресс-аудит. */
export function services(r: Assessment, profile: Profile): ServiceCard[] {
  const [git, loss, sfr, express] = spec.services;
  const n = r.flags.length;
  const picked: ServiceCard[] = [];
  if (n) picked.push({ ...git, text: fill(git.text, { count: n }, n) });
  if ((r.imin === 0 && r.diff >= EVEN_DIFF) || profile.p3 === ROLE_OWNER) picked.push(loss);
  if (!n && r.T >= 60 && profile.p4 !== ACCIDENT_FATAL) picked.push(sfr);
  const cards = picked.slice(0, SERVICE_CARDS);
  if (cards.length < SERVICE_CARDS) cards.push(express);
  return cards;
}

/** Блок 7 — фраза под заголовком «Расшифровка с экспертом» по роли. */
export function expertRole(profile: Profile): string {
  if (profile.p3 === ROLE_OWNER) return texts.b7_role_0;
  if (profile.p3 === ROLE_OT) return texts.b7_role_2;
  return texts.b7_role_other;
}
