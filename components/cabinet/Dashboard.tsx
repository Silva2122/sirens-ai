"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCabinetUser } from "@/components/cabinet/CabinetShell";
import { Pills, Stat, TileTitle } from "@/components/cabinet/Widgets";
import { listTestResults, loadDraft, type TestDraft, type TestResult } from "@/lib/api";
import { assess, dims, levels, texts, type Assessment } from "@/lib/assessment";

/** Повторный замер по методологии — через 90 дней. */
const REPEAT_DAYS = 90;
const DAY_MS = 86_400_000;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }).replace(".", "");

const addDays = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();

const daysLabel = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} день`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} дня`;
  return `${n} дней`;
};

/**
 * Дашборд — только главное: четыре показателя последнего замера, профиль
 * SIRENS и план на 90 дней. До первого опросника — штрихованные заглушки.
 */
export default function Dashboard() {
  const user = useCabinetUser();
  const [tests, setTests] = useState<TestResult[] | null>(null);
  const [draft, setDraft] = useState<TestDraft | null>(null);

  useEffect(() => {
    void listTestResults().then(setTests);
    void loadDraft().then(setDraft);
  }, []);

  if (!tests) return null;
  const [last, prev] = tests;
  const r = last ? assess(last.answers) : null;
  const repeatAt = last ? addDays(last.createdAt, REPEAT_DAYS) : null;
  const daysLeft = repeatAt ? Math.ceil((new Date(repeatAt).getTime() - Date.now()) / DAY_MS) : null;
  const resultHref = last ? `/cabinet/result/?id=${last.id}` : "/cabinet/test/";
  const draftStep = draft && Object.keys(draft.answers).length + Object.keys(draft.profile).length > 0 ? draft.step + 1 : null;

  return (
    <div className="board">
      <div className="board__head">
        <div className="board__hello">
          <h1 className="dash__title">Здравствуйте, {user.name}</h1>
          <p className="dash__sub">Оценка культуры безопасности и&nbsp;план её развития.</p>
        </div>
        <div className="board__actions">
          <Link href="/cabinet/test/" className="cta cta--md">
            {draftStep ? "Продолжить опросник" : last ? "Повторный замер" : "Пройти опросник"}
            <span className="cta__arrow">↗</span>
          </Link>
          {last && (
            <Link href={resultHref} className="board__ghost">
              Расшифровка
            </Link>
          )}
        </div>
      </div>

      {/* --- показатели ------------------------------------------------------ */}
      <div className="board__stats">
        <Stat
          label="Оценка"
          href={resultHref}
          value={last ? String(last.T) : "—"}
          unit={last ? "/ 100" : undefined}
          foot={
            !last
              ? "Появится после опросника"
              : prev
                ? `${last.T - prev.T >= 0 ? "+" : ""}${last.T - prev.T} к прошлому замеру`
                : "Первый замер"
          }
        />
        <Stat
          label="Уровень"
          href={resultHref}
          value={last ? levels[last.level].name : "—"}
          foot={
            !last
              ? "Тишина · Шум · Сирена · Сигнал · Резонанс"
              : last.capped
                ? "Ограничен несоответствиями"
                : `${levels[last.level].range[0]}–${levels[last.level].range[1]} баллов`
          }
        />
        <Stat
          label="Несоответствия"
          href={resultHref}
          value={r ? String(r.flags.length) : "—"}
          foot={!r ? "Обязательным требованиям" : r.flags.length ? "Обязательным требованиям" : "Не\u00a0выявлено"}
          alarm={!!r && r.flags.length > 0}
        />
        <Stat
          label="Следующий замер"
          href="/cabinet/test/"
          value={repeatAt ? shortDate(repeatAt) : "—"}
          foot={
            daysLeft === null
              ? `Раз в ${REPEAT_DAYS} дней`
              : daysLeft > 0
                ? `Через ${daysLabel(daysLeft)}`
                : "Пора пройти повторно"
          }
        />
      </div>

      <div className="board__grid">
        {/* --- профиль SIRENS -------------------------------------------------- */}
        <section className="tile tile--w7">
          <div className="tile__head">
            <TileTitle icon="bars">Профиль SIRENS</TileTitle>
            {r && !r.even && <span className="tile__note">Слабое направление&nbsp;— {dims[r.imin].letter}</span>}
          </div>
          <Pills
            values={last?.D ?? null}
            labels={last?.D.map(String)}
            accent={r && !r.even ? r.imax : null}
            soft={r && !r.even ? r.imin : null}
            empty="Профиль появится после опросника"
          />
        </section>

        {/* --- план на 90 дней ------------------------------------------------- */}
        <section className="tile tile--w5">
          <div className="tile__head">
            <TileTitle icon="target">План на&nbsp;90&nbsp;дней</TileTitle>
            {last && (
              <Link href={resultHref} className="tile__chip">
                Подробнее
              </Link>
            )}
          </div>
          <Plan r={r} />
        </section>

      </div>
    </div>
  );
}

// --- виджеты ----------------------------------------------------------------

function Plan({ r }: { r: Assessment | null }) {
  if (!r) return <Skeleton rows={3} text="Три первоочередных действия появятся после опросника" />;
  if (!r.priorities.length) return <p className="tile__text">{texts.b5_none}</p>;
  return (
    <ol className="rows rows--numbered">
      {r.priorities.map((p) => (
        <li key={p.q.code} className="rows__item">
          <span className="tile__text rows__lead rows__clamp">{p.q.action}</span>
          <span className="tile__meta">
            Вопрос {p.q.code}, {dims[p.q.dim - 1].name_lower}
            {p.flagged && <span className="rows__flag"> · несоответствие</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Skeleton({ rows, text }: { rows: number; text: string }) {
  return (
    <div className="skel">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="skel__row">
          <span className="skel__dot" />
          <span className="skel__lines">
            <span className="skel__line" />
            <span className="skel__line skel__line--short" />
          </span>
        </span>
      ))}
      <p className="skel__text">{text}</p>
    </div>
  );
}
