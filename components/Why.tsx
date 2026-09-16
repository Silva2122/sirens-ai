import SirenIcon from "@/components/SirenIcon";
import { triggers } from "@/lib/content";

export default function Why() {
  return (
    <section id="why" className="why">
      <div className="section-head">
        <div className="section-head__left">
          <div className="eyebrow">Почему это актуально</div>
          <h2 className="section-title">Вам будет полезен SIRENS, если…</h2>
        </div>
        <p className="lede">
          Законодательство обязывает каждого работодателя организовать систему
          управления охраной труда — независимо от численности сотрудников.
          Базовый комплект документов нужен всем.
        </p>
      </div>
      <div className="why__grid">
        {triggers.map((t) => (
          <a
            href="#services"
            className={`trigger trigger--w${t.col} trigger--h${t.row}`}
            key={t.n}
          >
            <div className="trigger__top">
              <SirenIcon variant={Number(t.n)} />
              <span className="trigger__arrow">↗</span>
            </div>
            <div className="trigger__body">
              <div className="trigger__text">{t.text}</div>
              <div className="trigger__link">{t.link}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
