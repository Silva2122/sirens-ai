"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CtaButton from "@/components/CtaButton";
import CabIcon from "@/components/cabinet/CabIcons";

const NAV = [
  { href: "#services", label: "Услуги" },
  { href: "#why", label: "Польза для\u00a0бизнеса" },
  { href: "#diagnostics", label: "Диагностика культуры безопасности" },
  { href: "#team", label: "Команда" },
  { href: "#contacts", label: "Контакты" },
];

/**
 * Шапка закреплена над всей страницей. На самом верху висит свободно, как в
 * макете первого экрана; после прокрутки прижимается и получает тёмную
 * стеклянную подложку. На узких экранах ссылки убраны под бургер.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Открытое меню закрываем, если экран стал шире мобильного или нажали Esc.
  // Пока оно открыто, страница под полноэкранным листом не прокручивается.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const narrow = window.matchMedia("(max-width: 640px)");
    const onChange = () => {
      if (!narrow.matches) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    narrow.addEventListener("change", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      narrow.removeEventListener("change", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className="header"
      data-scrolled={scrolled ? "1" : "0"}
      data-open={open ? "1" : "0"}
    >
      <nav className="nav">
        <a href="#top" className="logo" onClick={() => setOpen(false)}>
          SIRENS<span className="logo__dot">.</span>
        </a>

        <div className="nav__links" id="nav-links" data-glass="flat">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="nav__link"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          {/* На узких экранах кнопка живёт здесь, в выпадающем меню. */}
          <CtaButton
            className="cta cta--md nav__links-cta"
            onClick={() => setOpen(false)}
          >
            Оставить заявку
            <span className="cta__arrow">↗</span>
          </CtaButton>
        </div>

        <div className="nav__actions">
          {/* Вход в кабинет: без сессии /cabinet/ сам переведёт на страницу входа. */}
          <Link href="/cabinet/" className="nav__cabinet" aria-label="Личный кабинет" title="Личный кабинет">
            <CabIcon name="user" />
            <span className="nav__cabinet-label">Личный кабинет</span>
          </Link>
          <CtaButton className="cta cta--md nav__cta">
            Оставить заявку
            <span className="cta__arrow">↗</span>
          </CtaButton>
          <button
            type="button"
            className="nav__burger"
            aria-expanded={open}
            aria-controls="nav-links"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>
    </header>
  );
}
