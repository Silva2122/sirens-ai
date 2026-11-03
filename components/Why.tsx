import ServiceLink from "@/components/ServiceLink";
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
          управления охраной труда&nbsp;— независимо от&nbsp;численности сотрудников.{" "}
          <span className="lede__accent">
            Отсутствие или&nbsp;ненадлежащее функционирование такой системы влечёт
            для&nbsp;работодателя правовые и&nbsp;финансовые риски.
          </span>
        </p>
      </div>
      <div className="why__grid">
        {triggers.map((t) => (
          <ServiceLink
            service={t.service}
            className={`trigger trigger--w${t.col} trigger--h${t.row}`}
            key={t.n}
          >
            <div className="trigger__top">
              <SirenIcon variant={Number(t.n)} />
              <span className="trigger__arrow">↗</span>
            </div>
            {/* Название услуги на сайт не выводим — заказчик просил убрать
                подписи; t.service говорит лишь, какую услугу раскрыть по клику. */}
            <div className="trigger__body">
              <div className="trigger__text">{t.text}</div>
            </div>
          </ServiceLink>
        ))}
      </div>
    </section>
  );
}
