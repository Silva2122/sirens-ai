import { groups } from "@/lib/content";

export default function Services({ showPrices = true }: { showPrices?: boolean }) {
  return (
    <section id="services" className="services">
      <div className="services__aside">
        <div className="eyebrow">Услуги</div>
        <h2 className="section-title">Что мы делаем.</h2>
        <p className="lede">
          Три направления, десять позиций: от базового комплекта документов до
          внедрения LOTO и ИИ-платформы.
        </p>
      </div>
      <div className="services__list">
        {groups.map((g) => (
          <div className="group" key={g.n}>
            <div className="group__head">
              <div className="group__headLeft">
                <span className="group__n">{g.n}</span>
                <span className="group__title">{g.title}</span>
              </div>
              <span className="group__count">{g.count}</span>
            </div>
            <div className="group__items">
              {g.items.map((s) => (
                <div className="service" key={s.name}>
                  <div className="service__name">{s.name}</div>
                  {showPrices && <div className="service__price">{s.price}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
