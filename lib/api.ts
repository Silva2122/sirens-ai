"use client";

import { assess, type Answers, type Profile } from "@/lib/assessment";
import { quizQuestions, quizScore, type QuizAnswers } from "@/lib/quiz";

/**
 * ЗАГЛУШКА серверной части квиза и личного кабинета. Всё хранится в
 * localStorage этого браузера — только для локальной разработки. Когда
 * выберем бэкенд, меняем тела функций на запросы к серверу; сигнатуры и
 * типы остаются, компоненты трогать не придётся.
 *
 * Что должен будет делать сервер:
 * - submitQuiz — сохранить ответы и контакты, отправить письмо с результатом
 *   на почту человека и уведомление на почту SIRENS;
 * - register / login / logout / currentUser — учётные записи и сессия (cookie);
 * - черновик, результаты, отзыв и заявка на расшифровку по опроснику SIRENS.
 *   По методологии в базе хранятся все 31 ответ, профиль, показатели, дата
 *   и UTM — для отраслевых бенчмарков.
 */

export type Contact = {
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
};

export type User = Contact & { id: string; createdAt: string };

export type QuizResult = {
  id: string;
  contact: Contact;
  /** оценка 0–100 */
  T: number;
  /** уровень с учётом несоответствий; в квизах до демо-версии его нет */
  level?: number;
  /** коды вопросов с несоответствием обязательным требованиям */
  flags?: string[];
  createdAt: string;
};

/** Результат опросника SIRENS. Хранятся ответы — показатели и тексты
 *  пересчитываются при показе, так правки спецификации видны и в старых
 *  результатах. T, level и D — копия для списков и сравнения замеров. */
export type TestResult = {
  id: string;
  userId: string;
  answers: Answers;
  profile: Profile;
  T: number;
  level: number;
  capped: boolean;
  D: number[];
  createdAt: string;
};

export type TestDraft = { answers: Answers; profile: Profile; step: number };

export type Feedback = { rate: number; plus: string; minus: string };

export type ApiErrorCode = "exists" | "credentials" | "unauthorized" | "not-found";

export class ApiError extends Error {
  constructor(public code: ApiErrorCode) {
    super(code);
  }
}

const KEY = {
  users: "sirens:users",
  session: "sirens:session",
  quiz: "sirens:quiz-results",
  tests: "sirens:test-results",
  draft: "sirens:test-draft:",
  feedback: "sirens:feedback",
  expert: "sirens:expert-requests",
};

type StoredUser = User & { passwordHash: string };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Имитация сети, чтобы в интерфейсе были видны состояния загрузки. */
const delay = () => new Promise((r) => setTimeout(r, 400));

const id = () => crypto.randomUUID();

async function hash(password: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const strip = ({ passwordHash: _, ...user }: StoredUser): User => user;

// --- демо-аккаунты (npm run dev и тестовая сборка для заказчика) ----------

/** Вход для визуальной доработки кабинета: в боевую сборку не попадает. */
export const DEMO = { email: "demo@sirens.test", password: "demo2026" };

/**
 * Готовые входы. Бэкенда нет, учётные записи живут в localStorage браузера,
 * поэтому они создаются при первом заходе на сайт в каждом браузере.
 * Включены в dev и в тестовой сборке (NEXT_PUBLIC_DEMO=1, scripts/deploy-test.sh).
 */
const DEMO_ACCOUNTS: { id: string; password: string; contact: Contact }[] = [
  {
    id: "demo-user",
    password: DEMO.password,
    contact: { name: "Мария Демидова", company: "ООО «Демо-Завод»", position: "Руководитель службы ОТиПБ", phone: "+7 900 000-00-00", email: DEMO.email },
  },
  {
    id: "demo-natalia",
    password: "sirens-n01",
    contact: { name: "Наталья", company: "SIRENS", position: "Эксперт по ОТиПБ", phone: "+7 900 000-00-01", email: "natalia@sirens.test" },
  },
  {
    id: "demo-anastasia",
    password: "sirens-a02",
    contact: { name: "Анастасия", company: "SIRENS", position: "Эксперт по системам управления", phone: "+7 900 000-00-02", email: "anastasia@sirens.test" },
  },
  {
    id: "demo-test1",
    password: "test-0301",
    contact: { name: "Иван Петров", company: "АО «Тест-Металл»", position: "Инженер по охране труда", phone: "+7 900 000-00-03", email: "test1@sirens.test" },
  },
  {
    id: "demo-test2",
    password: "test-0402",
    contact: { name: "Ольга Смирнова", company: "ООО «Тест-Логистика»", position: "HR-директор", phone: "+7 900 000-00-04", email: "test2@sirens.test" },
  },
];

const DEMO_ENABLED =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO === "1";

/** Создаёт недостающих демо-пользователей с пройденным квизом, но без
 *  опросника — чтобы пройти путь «тест → результат» с начала. */
async function seedDemo() {
  if (!DEMO_ENABLED) return;
  // заготовленные замеры из первой версии демо — убираем, тест проходим сами
  write(KEY.tests, read<TestResult[]>(KEY.tests, []).filter((t) => !t.id.startsWith("demo-test-")));
  const users = read<StoredUser[]>(KEY.users, []);
  const missing = DEMO_ACCOUNTS.filter((a) => !users.some((u) => u.email === a.contact.email));
  if (!missing.length) return;

  const created: StoredUser[] = [];
  for (const a of missing) {
    created.push({
      ...a.contact,
      id: a.id,
      createdAt: "2026-09-01T09:00:00.000Z",
      passwordHash: await hash(a.password),
    });
  }
  write(KEY.users, [...users, ...created]);
  write(KEY.quiz, [
    ...read<QuizResult[]>(KEY.quiz, []),
    ...missing.map((a) => ({
      id: `${a.id}-quiz`,
      contact: a.contact,
      ...quizScore(Object.fromEntries(quizQuestions.map((q) => [q.code, 1]))),
      createdAt: "2026-09-01T08:40:00.000Z",
    })),
  ]);
}

// --- квиз -------------------------------------------------------------------

export async function submitQuiz(contact: Contact, answers: QuizAnswers): Promise<QuizResult> {
  await delay();
  const result: QuizResult = {
    id: id(),
    contact,
    ...quizScore(answers),
    createdAt: new Date().toISOString(),
  };
  write(KEY.quiz, [...read<QuizResult[]>(KEY.quiz, []), result]);
  // письма пока нет: в консоли видно, что ушло бы на почту
  console.info("[заглушка] письмо с результатом квиза →", contact.email, { answers, result });
  return result;
}

/** Последний квиз — им заполняем регистрацию, чтобы не вводить контакты дважды. */
export function lastQuizResult(): QuizResult | null {
  return read<QuizResult[]>(KEY.quiz, []).at(-1) ?? null;
}

export async function quizResultFor(email: string): Promise<QuizResult | null> {
  const mine = read<QuizResult[]>(KEY.quiz, []).filter(
    (r) => r.contact.email.toLowerCase() === email.toLowerCase()
  );
  return mine.at(-1) ?? null;
}

// --- учётные записи ---------------------------------------------------------

export async function register(contact: Contact, password: string): Promise<User> {
  await delay();
  const users = read<StoredUser[]>(KEY.users, []);
  const email = contact.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) throw new ApiError("exists");
  const user: StoredUser = {
    ...contact,
    email,
    id: id(),
    createdAt: new Date().toISOString(),
    passwordHash: await hash(password),
  };
  write(KEY.users, [...users, user]);
  write(KEY.session, user.id);
  return strip(user);
}

export async function login(email: string, password: string): Promise<User> {
  await delay();
  await seedDemo();
  const passwordHash = await hash(password);
  const user = read<StoredUser[]>(KEY.users, []).find(
    (u) => u.email === email.trim().toLowerCase() && u.passwordHash === passwordHash
  );
  if (!user) throw new ApiError("credentials");
  write(KEY.session, user.id);
  return strip(user);
}

export async function logout(): Promise<void> {
  localStorage.removeItem(KEY.session);
}

export async function currentUser(): Promise<User | null> {
  await seedDemo();
  const sid = read<string | null>(KEY.session, null);
  const user = read<StoredUser[]>(KEY.users, []).find((u) => u.id === sid);
  return user ? strip(user) : null;
}

async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) throw new ApiError("unauthorized");
  return user;
}

// --- опросник SIRENS --------------------------------------------------------

/** Черновик: прогресс не теряется при закрытии вкладки (требование методологии). */
export async function loadDraft(): Promise<TestDraft | null> {
  const user = await requireUser();
  return read<TestDraft | null>(KEY.draft + user.id, null);
}

export async function saveDraft(draft: TestDraft): Promise<void> {
  const user = await requireUser();
  write(KEY.draft + user.id, draft);
}

export async function clearDraft(): Promise<void> {
  const user = await requireUser();
  localStorage.removeItem(KEY.draft + user.id);
}

export async function saveTestResult(answers: Answers, profile: Profile): Promise<TestResult> {
  await delay();
  const user = await requireUser();
  const r = assess(answers);
  const result: TestResult = {
    id: id(),
    userId: user.id,
    answers,
    profile,
    T: r.T,
    level: r.level,
    capped: r.capped,
    D: r.D,
    createdAt: new Date().toISOString(),
  };
  write(KEY.tests, [...read<TestResult[]>(KEY.tests, []), result]);
  localStorage.removeItem(KEY.draft + user.id);
  return result;
}

/** История текущего пользователя, свежие сверху. */
export async function listTestResults(): Promise<TestResult[]> {
  const user = await requireUser();
  return read<TestResult[]>(KEY.tests, [])
    .filter((r) => r.userId === user.id)
    .reverse();
}

export async function getTestResult(resultId: string): Promise<TestResult> {
  const user = await requireUser();
  const result = read<TestResult[]>(KEY.tests, []).find(
    (r) => r.id === resultId && r.userId === user.id
  );
  if (!result) throw new ApiError("not-found");
  return result;
}

/** Отзыв об опроснике — сохраняется вместе с результатом. */
export async function sendFeedback(resultId: string, feedback: Feedback): Promise<void> {
  await delay();
  const user = await requireUser();
  write(KEY.feedback, [
    ...read<unknown[]>(KEY.feedback, []),
    { resultId, userId: user.id, ...feedback, createdAt: new Date().toISOString() },
  ]);
}

/** Заявка на расшифровку с экспертом: контакты уже известны из кабинета. */
export async function requestExpert(resultId: string): Promise<void> {
  await delay();
  const user = await requireUser();
  write(KEY.expert, [
    ...read<unknown[]>(KEY.expert, []),
    { resultId, user, createdAt: new Date().toISOString() },
  ]);
  console.info("[заглушка] заявка на расшифровку →", user.email, resultId);
}
