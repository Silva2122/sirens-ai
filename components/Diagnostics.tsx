import { steps } from "@/lib/content";

export default function Diagnostics() {
  return (
    <section id="diagnostics" className="diagnostics">
      <div className="section-head">
        <div className="section-head__left">
          <div className="eyebrow">Диагностика культуры безопасности</div>
          <h2 className="section-title">Услышать, а не предположить.</h2>
        </div>
        <div className="diagnostics__intro">
          <p className="lede">
            Комплексная диагностика культуры безопасности — от быстрой
            онлайн-оценки на сайте до анонимного опроса и интервью с сотрудниками
            всех уровней.
          </p>
          <a href="#contacts" className="cta cta--md">
            Оценить уровень культуры безопасности
            <span className="cta__arrow">↗</span>
          </a>
        </div>
      </div>
      <div className="diagnostics__steps">
        {steps.map((s) => (
          <div className="step" key={s.n}>
            <div className={`step__art step__art--${s.n}`} aria-hidden="true" />
            <div className="step__n">{s.n}</div>
            <div className="step__text" lang="ru">
              {s.text}
            </div>
          </div>
        ))}
      </div>
      <div className="note">Онлайн-инструмент диагностики ещё не спроектирован.</div>
    </section>
  );
}
