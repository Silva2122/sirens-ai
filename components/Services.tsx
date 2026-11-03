"use client";

import { useEffect, useRef, useState } from "react";
import CtaButton from "@/components/CtaButton";
import { SERVICE_EVENT } from "@/components/ServiceLink";
import { groups, type ServiceItem, type ServiceSlug } from "@/lib/content";

/**
 * Четыре группы услуг вертикальным списком; каждая раскрывается по клику и
 * показывает свои позиции с ценами. Первая открыта сразу, чтобы список не
 * выглядел пустым. Открытых групп может быть несколько — сравнивать удобнее.
 *
 * Второй уровень: строка услуги раскрывается во вкладыш с описанием, составом,
 * шагами и выгодами (lib/content.ts, details). Внутри группы открыта одна
 * услуга за раз; у позиции без details (SaaS) раскрытия нет.
 */
/**
 * На телефоне после раскрытия подводим экран к началу раскрытого блока —
 * иначе высота меняется где-то снизу и непонятно, куда смотреть. Ждём конец
 * анимации высоты (grid-rows, 0.45s), чтобы не ехать по движущейся странице.
 * На широких экранах не нужно: панель и так в поле зрения.
 */
function scrollToEl(el: HTMLElement) {
  const header = document.querySelector<HTMLElement>(".header");
  const offset = (header?.offsetHeight ?? 0) + 12;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

function scrollToOpened(el: HTMLElement | null) {
  if (!el || !window.matchMedia("(max-width: 900px)").matches) return;
  window.setTimeout(() => scrollToEl(el), 460);
}

/** Группа, в которой лежит услуга с таким слагом, и сама услуга. */
function findService(slug: string) {
  for (const g of groups) {
    const item = g.items.find((s) => s.slug === slug);
    if (item) return { group: g, item };
  }
  return null;
}

export default function Services({ showPrices = true }: { showPrices?: boolean }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set([groups[0].n]));
  const [openService, setOpenService] = useState<string | null>(null);

  // Переход на конкретную услугу: из карточек «Почему» (событие от ServiceLink)
  // или по ссылке вида #service-<slug>. Раскрываем группу и строку, подводим
  // экран сразу (строка уже примерно на месте) и ещё раз после анимации высоты.
  useEffect(() => {
    const reveal = (slug: string) => {
      const found = findService(slug);
      if (!found || !found.item.details) return;
      setOpen((prev) => (prev.has(found.group.n) ? prev : new Set(prev).add(found.group.n)));
      setOpenService(found.item.name);
      const el = document.getElementById(`service-${slug}`)?.parentElement;
      if (!el) return;
      scrollToEl(el);
      window.setTimeout(() => scrollToEl(el), 480);
    };
    const onEvent = (e: Event) => reveal((e as CustomEvent<{ slug: ServiceSlug }>).detail.slug);
    const onHash = () => {
      const m = window.location.hash.match(/^#service-([\w-]+)$/);
      if (m) reveal(m[1]);
    };
    onHash();
    window.addEventListener(SERVICE_EVENT, onEvent);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener(SERVICE_EVENT, onEvent);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const toggle = (n: string, el: HTMLElement) => {
    const willOpen = !open.has(n);
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
    if (willOpen) scrollToOpened(el);
  };

  return (
    <section id="services" className="services">
      <div className="services__head">
        <div className="eyebrow">Услуги</div>
        <h2 className="section-title">Что&nbsp;мы делаем.</h2>
      </div>
      <div className="services__list">
        {groups.map((g) => {
          const isOpen = open.has(g.n);
          const panelId = `group-panel-${g.n}`;
          return (
            <div className="group" data-open={isOpen ? "1" : "0"} key={g.n}>
              <button
                type="button"
                className="group__head"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={(e) => toggle(g.n, e.currentTarget.parentElement as HTMLElement)}
              >
                <span className="group__n">{g.n}</span>
                <span className="group__headText">
                  <span className="group__title">{g.title}</span>
                  <span className="group__audience">{g.audience}</span>
                </span>
                <span className="group__count">{g.count}</span>
                <span className="group__chevron" aria-hidden="true" />
              </button>
              {/* Панель всегда в DOM: высота анимируется через grid-rows,
                  а скрытая — недоступна для табуляции и читалок. */}
              <div className="group__panel" id={panelId} aria-hidden={!isOpen}>
                <div className="group__panelInner">
                  <div className="group__items">
                    {g.items.map((s) => (
                      <Service
                        key={s.name}
                        item={s}
                        showPrice={showPrices}
                        open={openService === s.name}
                        onToggle={(el) => {
                          const willOpen = openService !== s.name;
                          setOpenService((cur) => (cur === s.name ? null : s.name));
                          if (willOpen) scrollToOpened(el);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Service({
  item,
  showPrice,
  open,
  onToggle,
}: {
  item: ServiceItem;
  showPrice: boolean;
  open: boolean;
  onToggle: (el: HTMLElement | null) => void;
}) {
  const d = item.details;
  const rootRef = useRef<HTMLDivElement>(null);
  const id = `service-${item.slug}`;

  // без подробностей — простая строка, как раньше
  if (!d) {
    return (
      <div className="service service--plain">
        <div className="service__name">{item.name}</div>
        {showPrice && <div className="service__price">{item.price}</div>}
      </div>
    );
  }

  return (
    <div className="service" data-open={open ? "1" : "0"} ref={rootRef}>
      <button
        type="button"
        className="service__row"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => onToggle(rootRef.current)}
      >
        <span className="service__name">{item.name}</span>
        {showPrice && <span className="service__price">{item.price}</span>}
        <span className="service__chevron" aria-hidden="true" />
      </button>
      <div className="service__panel" id={id} aria-hidden={!open}>
        <div className="service__panelInner">
          <div className="service__detail">
            <p className="service__text">{d.text}</p>

            {d.tiers && (
              <div className="service__tiers">
                {d.tiers.map((t, i) => (
                  <div className="tier" key={t.name}>
                    <div className="tier__head">
                      <span className="tier__n">0{i + 1}</span>
                      <span className="tier__name">{t.name}</span>
                    </div>
                    <p className="tier__includes">{t.includes}</p>
                    <div className="tier__meta">
                      <span className="tier__price">{t.price}</span>
                      <span className="tier__term">{t.term}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="service__cols">
              {d.includes && (
                <div className="service__col">
                  <div className="service__label">Что&nbsp;входит</div>
                  <ul className="service__list">
                    {d.includes.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
              {d.steps && (
                <div className="service__col">
                  <div className="service__label">Как&nbsp;проходит работа</div>
                  <ol className="service__steps">
                    {d.steps.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="service__col">
                <div className="service__label">Что&nbsp;это даёт</div>
                <ul className="service__list service__list--gives">
                  {d.gives.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="service__foot">
              {d.term && (
                <span className="service__term">
                  <span className="service__label">Срок</span>
                  {d.term}
                </span>
              )}
              <CtaButton className="cta cta--md" service={item.name}>
                Оставить заявку на&nbsp;услугу
                <span className="cta__arrow">↗</span>
              </CtaButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
