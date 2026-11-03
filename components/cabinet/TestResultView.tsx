"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CabIcon, { type CabIconName } from "@/components/cabinet/CabIcons";
import { formatDate } from "@/components/cabinet/Dashboard";
import { Pills, Stat, TileTitle } from "@/components/cabinet/Widgets";
import LevelMeter from "@/components/LevelMeter";
import { getTestResult, requestExpert, sendFeedback, type TestResult } from "@/lib/api";
import {
  assess,
  conclusion,
  dims,
  direction,
  expertRole,
  fill,
  levels,
  portrait,
  profileText,
  roadmap,
  services,
  texts,
  type Assessment,
} from "@/lib/assessment";

const ROAD_DAYS = ["Дни 1–30", "Дни 31–60", "Дни 61–90"];
const ACCIDENT_FATAL = 2;
const FORMAL_HIGH = 30;

/** Значки пунктов заключения — по порядку conclusion(): уровень, слабое
 *  направление, несоответствия, формализм, [тяжёлый случай], роль. */
function conclusionIcon(i: number, fatal: boolean): CabIconName {
  const base: CabIconName[] = ["gauge", "weak", "risk", "doc"];
  if (i < base.length) return base[i];
  return fatal && i === base.length ? "risk" : "user";
}

/**
 * Результат опросника SIRENS в раскладке дашборда: показатели, затем
 * карточки по блокам ТЗ — заключение и уровень, профиль и структура,
 * направления, действия и несоответствия, дорожная карта, услуги и эксперт,
 * разбор по вопросам, отзыв. Тексты методологии выводятся дословно.
 */
export default function TestResultView() {
  const id = useSearchParams().get("id") ?? "";
  const [result, setResult] = useState<TestResult | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getTestResult(id).then(setResult, () => setMissing(true));
  }, [id]);

  const r = useMemo(() => (result ? assess(result.answers) : null), [result]);

  return (
    <div className="board">
      <div className="board__head">
        <div className="board__hello">
          <h1 className="dash__title">Результат оценки</h1>
          <p className="dash__sub">{result ? formatDate(result.createdAt) : missing ? "Такого результата нет." : " "}</p>
        </div>
        <div className="board__actions">
          {result && (
            <a href="#expert" className="cta cta--md">
              {texts.b7_form.submit}
              <span className="cta__arrow">↗</span>
            </a>
          )}
          <Link href="/cabinet/" className="board__ghost">
            К&nbsp;дашборду
          </Link>
        </div>
      </div>
      {result && r && <Report result={result} r={r} />}
    </div>
  );
}

function Report({ result, r }: { result: TestResult; r: Assessment }) {
  const p = portrait(r);
  const road = roadmap(r);
  const n = r.flags.length;
  const strong = r.even ? null : r.imax;
  const weak = r.even ? null : r.imin;

  return (
    <>
      <div className="board__stats">
        <Stat
          label="Оценка"
          value={String(r.T)}
          unit="/ 100"
          foot="Взвешенно по&nbsp;шести направлениям"
        />
        <Stat label="Уровень" value={levels[r.level].name} foot={r.capped ? "Ограничен несоответствиями" : `${levels[r.level].range[0]}–${levels[r.level].range[1]} баллов`} />
        <Stat
          label="Несоответствия"
          value={String(n)}
          foot={n ? "Обязательным требованиям" : "Не\u00a0выявлено"}
          alarm={n > 0}
        />
        <Stat
          label="Индекс формализма"
          value={`${r.formal}%`}
          foot={r.formal >= FORMAL_HIGH ? "Выше допустимого" : "В\u00a0допустимых пределах"}
          alarm={r.formal >= FORMAL_HIGH}
        />
      </div>

      <div className="board__grid">
        {/* 1. Заключение и портрет уровня */}
        <section className="tile tile--w7">
          <TileTitle icon="doc">Заключение</TileTitle>
          {r.capped && <p className="tile__alert">{texts.b1_capped}</p>}
          <ul className="rows">
            {conclusion(r, result.profile).map((t, i) => (
              <li key={t} className="rows__item rows__item--icon">
                <span className="rows__icon">
                  <CabIcon name={conclusionIcon(i, result.profile.p4 === ACCIDENT_FATAL)} />
                </span>
                <span className="tile__text">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="tile tile--w5">
          <div className="tile__head">
            <TileTitle icon="gauge">Уровень «{levels[r.level].name}»</TileTitle>
            <span className="tile__note">{r.T} / 100</span>
          </div>
          <LevelMeter T={r.T} level={r.level} compact bare />
          <dl className="rows">
            <div className="rows__item">
              <dt className="tile__label">Что&nbsp;означает уровень</dt>
              <dd className="tile__text">{p.mean}</dd>
            </div>
            <div className="rows__item">
              <dt className="tile__label">Последствия для&nbsp;бизнеса</dt>
              <dd className="tile__text">{p.risk}</dd>
            </div>
            <div className="rows__item">
              <dt className="tile__label">Главная задача на&nbsp;90&nbsp;дней</dt>
              <dd className="tile__text">{p.task}</dd>
            </div>
          </dl>
        </section>

        {/* 2. Профиль SIRENS и 3. Структура культуры */}
        <section className="tile tile--w7">
          <div className="tile__head">
            <TileTitle icon="bars">{texts.b2_title}</TileTitle>
            {weak !== null && <span className="tile__note">Слабое направление&nbsp;— {dims[weak].letter}</span>}
          </div>
          <Pills values={r.D} labels={r.D.map(String)} accent={strong} soft={weak} />
          {profileText(r).map((t) => (
            <p key={t} className="tile__text">
              {t}
            </p>
          ))}
        </section>

        <section className="tile tile--w5">
          <TileTitle icon="layers">{texts.b3_title}</TileTitle>
          <p className="tile__meta">{texts.b3_sub}</p>
          <div className="dist">
            <div className="dist__bar">
              {r.dist.map((v, i) => (
                <span
                  key={levels[i].name}
                  className="dist__part"
                  data-level={i}
                  style={{ ["--share" as string]: v / 100 }}
                />
              ))}
            </div>
            <ul className="dist__legend">
              {r.dist.map((v, i) => (
                <li key={levels[i].name} className="dist__key" data-level={i}>
                  <span className="dist__name">{levels[i].name}</span>
                  <span className="dist__pct">{v}%</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="tile__text">
            {fill(r.formal >= FORMAL_HIGH ? texts.b3_formal_high : texts.b3_formal_low, { N: r.formal })}
          </p>
          {result.profile.p4 === ACCIDENT_FATAL && <p className="tile__alert">{texts.b3_fatal}</p>}
        </section>

        {/* 2а. Расшифровка направлений */}
        <section className="tile tile--w12">
          <TileTitle icon="list">{texts.b2a_title}</TileTitle>
          <div className="acc">
            {dims.map((d, i) => {
              const dir = direction(i, r.D[i]);
              return (
                <details key={d.id} className="acc__item" open={i === weak}>
                  <summary className="acc__head">
                    <span className="acc__code">{d.letter}</span>
                    <span className="acc__title">{d.name}</span>
                    <span className="acc__meta">
                      {r.D[i]} · {dir.name}
                    </span>
                  </summary>
                  <dl className="acc__cols">
                    <div>
                      <dt className="tile__label acc__label">
                        <CabIcon name="pulse" />
                        Диагноз
                      </dt>
                      <dd className="tile__text">{dir.diagnosis}</dd>
                    </div>
                    <div>
                      <dt className="tile__label acc__label">
                        <CabIcon name="risk" />
                        Риск
                      </dt>
                      <dd className="tile__text">{dir.risk}</dd>
                    </div>
                    <div>
                      <dt className="tile__label acc__label">
                        <CabIcon name="flag" />
                        Первый шаг
                      </dt>
                      <dd className="tile__text">{dir.first_step}</dd>
                    </div>
                  </dl>
                </details>
              );
            })}
          </div>
        </section>

        {/* 5. Первоочередные действия и 4. Несоответствия */}
        <section className="tile tile--w7">
          <TileTitle icon="target">{r.priorities.length === 3 ? texts.b5_title_3 : texts.b5_title_other}</TileTitle>
          {r.priorities.length ? (
            <ol className="rows rows--numbered">
              {r.priorities.map((pr) => (
                <li key={pr.q.code} className="rows__item">
                  <span className="tile__text rows__lead rows__lead--lg">{pr.q.action}</span>
                  <span className="tile__meta">
                    {pr.next
                      ? fill(texts.b5_card_meta, {
                          code: pr.q.code,
                          dim_name_lower: dims[pr.q.dim - 1].name_lower,
                          next_step: pr.next.t,
                        })
                      : fill(texts.b5_card_meta_no_next, {
                          code: pr.q.code,
                          dim_name_lower: dims[pr.q.dim - 1].name_lower,
                        })}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="tile__text">{texts.b5_none}</p>
          )}
        </section>

        <section className="tile tile--w5">
          <TileTitle icon="risk">{fill(texts.b4_title, { count: n })}</TileTitle>
          {n ? (
            <>
              <p className="tile__meta">{texts.b4_intro}</p>
              <ul className="rows">
                {r.flags.map((f) => (
                  <li key={f.q.code} className="rows__item rows__item--flag">
                    <span className="acc__code">{f.q.code}</span>
                    <span className="tile__text">{f.q.flag}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="tile__text">{texts.b4_none}</p>
          )}
        </section>

        {/* Дорожная карта */}
        <section className="tile tile--w12">
          <TileTitle icon="route">{texts.b5_road_title}</TileTitle>
          <ol className="road">
            {road.map((t, i) => (
              <li key={ROAD_DAYS[i]} className="road__step">
                <span className="road__node" aria-hidden="true" />
                <span className="road__phase">{ROAD_DAYS[i]}</span>
                <span className="tile__text">{t}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* 6. Услуги и 7. Эксперт */}
        <section className="tile tile--w7">
          <TileTitle icon="case">{texts.b6_title}</TileTitle>
          <ul className="rows">
            {services(r, result.profile).map((s) => (
              <li key={s.id} className="rows__item">
                <span className="rows__lead tile__text tile__text--strong">{s.name}</span>
                <span className="tile__text">{s.text}</span>
                <Link href="/#contacts" className="tile__btn rows__link">
                  Обсудить услугу
                  <span className="tile__btn-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <ExpertBlock resultId={result.id} role={expertRole(result.profile)} />

        {/* 9. Расшифровка по вопросам */}
        <section className="tile tile--w12">
          <div className="tile__head">
            <TileTitle icon="test">{texts.b9_title}</TileTitle>
            <span className="tile__note">{texts.b9_sub}</span>
          </div>
          {dims.map((d) => (
            <div key={d.id} className="acc acc--group">
              <span className="tile__label">
                {d.letter} · {d.name}
              </span>
              {r.perQuestion
                .filter((pq) => pq.q.dim === d.id)
                .map((pq) => {
                  const a = result.answers[pq.q.code];
                  return (
                    <details key={pq.q.code} className="acc__item">
                      <summary className="acc__head">
                        <span className="acc__code">{pq.q.code}</span>
                        <span className="acc__title">{pq.q.text}</span>
                        <span className="acc__meta" data-flag={pq.flagged ? "1" : "0"}>
                          {pq.score === null ? "—" : levels[Math.round(pq.score)].name}
                        </span>
                      </summary>
                      <div className="acc__body">
                        {a?.na ? (
                          <p className="tile__text">
                            Ваш ответ: {pq.q.na}&nbsp;— вопрос не&nbsp;учитывается в&nbsp;расчёте.
                          </p>
                        ) : (
                          a?.picked.map((i) => (
                            <p key={i} className="tile__text">
                              {fill(texts.b9_answer, {
                                chosen: pq.q.opts[i].t,
                                level_name: levels[pq.q.opts[i].l].name,
                              })}
                            </p>
                          ))
                        )}
                        {pq.next && <p className="tile__text">{fill(texts.b9_next, { next_step: pq.next.t })}</p>}
                        <p className="tile__text">{fill(texts.b9_action, { action: pq.q.action })}</p>
                        <p className="tile__meta">{fill(texts.b9_check, { check: pq.q.check })}</p>
                        {pq.flagged && pq.q.flag && (
                          <p className="tile__alert">{fill(texts.b9_flag, { flag: pq.q.flag })}</p>
                        )}
                      </div>
                    </details>
                  );
                })}
            </div>
          ))}
        </section>

        {/* 8. Оценка опросника */}
        <FeedbackBlock resultId={result.id} />
      </div>
    </>
  );
}

function ExpertBlock({ resultId, role }: { resultId: string; role: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  return (
    <section className="tile tile--w5 tile--cta expert" id="expert">
      {/* иллюстрация из серии шагов диагностики: две линзы — разговор с экспертом */}
      <span className="expert__art" aria-hidden="true" />
      <TileTitle icon="user">{texts.b7_title}</TileTitle>
      <p className="tile__text">{role}</p>
      <p className="tile__meta">{texts.b7_tail}</p>
      <button
        type="button"
        className="cta cta--md tile__cta"
        disabled={state !== "idle"}
        onClick={async () => {
          setState("sending");
          await requestExpert(resultId);
          setState("sent");
        }}
      >
        {state === "sent" ? "Заявка отправлена" : state === "sending" ? "Отправляем…" : texts.b7_form.submit}
        <span className="cta__arrow">↗</span>
      </button>
    </section>
  );
}

function FeedbackBlock({ resultId }: { resultId: string }) {
  const [rate, setRate] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  if (state === "sent") {
    return (
      <section className="tile tile--w12">
        <TileTitle icon="star">{texts.b8_title}</TileTitle>
        <p className="tile__text">{texts.b8_thanks}</p>
      </section>
    );
  }

  return (
    <form
      className="tile tile--w12 feedback"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setState("sending");
        await sendFeedback(resultId, {
          rate,
          plus: String(data.get("plus") ?? ""),
          minus: String(data.get("minus") ?? ""),
        });
        setState("sent");
      }}
    >
      <div className="tile__head">
        <TileTitle icon="star">{texts.b8_title}</TileTitle>
        <span className="tile__note">{texts.b8_intro}</span>
      </div>
      <div className="feedback__grid">
        <div className="feedback__rate" role="radiogroup" aria-label={texts.b8_rate}>
          <span className="tile__label">{texts.b8_rate}</span>
          <div className="feedback__stars">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={rate === v}
                className="feedback__star"
                data-on={v <= rate ? "1" : "0"}
                onClick={() => setRate(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <label className="feedback__field">
          <span className="tile__label">{texts.b8_plus}</span>
          <textarea name="plus" rows={3} placeholder={texts.b8_plus_ph} />
        </label>
        <label className="feedback__field">
          <span className="tile__label">{texts.b8_minus}</span>
          <textarea name="minus" rows={3} placeholder={texts.b8_minus_ph} />
        </label>
      </div>
      <button type="submit" className="cta cta--md tile__cta" disabled={!rate || state === "sending"}>
        {state === "sending" ? "Отправляем…" : texts.b8_submit}
        <span className="cta__arrow">↗</span>
      </button>
    </form>
  );
}
