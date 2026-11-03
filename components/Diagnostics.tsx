import QuizButton from "@/components/QuizButton";
import { steps } from "@/lib/content";

export default function Diagnostics() {
  return (
    <section id="diagnostics" className="diagnostics">
      <div className="section-head">
        <div className="section-head__left">
          <div className="eyebrow">Диагностика культуры безопасности</div>
          <h2 className="section-title">
            Оцените ваш уровень культуры безопасности.
          </h2>
        </div>
        <div className="diagnostics__intro">
          <p className="lede">
            Пройдите самостоятельную онлайн-диагностику культуры безопасности и
            отследите динамику улучшений.
          </p>
          {/* На телефоне длинная подпись ломается в две строки — там короткая. */}
          {/* Кнопка открывает экспресс-квиз в попапе; полный тест — в личном
              кабинете, куда квиз приглашает в конце. */}
          <QuizButton className="cta cta--md">
            <span className="cta__label cta__label--full">
              Оценить уровень культуры безопасности
            </span>
            <span className="cta__label cta__label--short">Пройти диагностику</span>
            <span className="cta__arrow">↗</span>
          </QuizButton>
        </div>
      </div>
      <div className="diagnostics__steps">
        {steps.map((s) => (
          <div className="step" key={s.n}>
            <div className={`step__art step__art--${s.art}`} aria-hidden="true" />
            <div className="step__n">{s.n}</div>
            <div className="step__text" lang="ru">
              {s.text}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
