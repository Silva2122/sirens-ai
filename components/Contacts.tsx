"use client";

import { useEffect, useRef, useState } from "react";

export default function Contacts() {
  const [sent, setSent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Фоновый ролик крутится сам, но при prefers-reduced-motion замирает на постере.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (media.matches) {
        video.pause();
      } else {
        void video.play().catch(() => {});
      }
    };

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return (
    <section id="contacts" className="contacts">
      {/* suppressHydrationWarning: браузерные расширения для видео (VLC и т.п.)
          дописывают свои классы в <video> до гидрации — это не наша разметка. */}
      <video
        ref={videoRef}
        className="contacts__video"
        suppressHydrationWarning
        src="/assets/contacts-beacon.mp4"
        poster="/assets/contacts-beacon-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <div className="contacts__scrim" />
      <div className="contacts__fade" />

      <div className="contacts__left">
        <div className="contacts__head">
          <div className="eyebrow">Контакты</div>
          <h2 className="section-title">
            Риск не ждёт
            <br />
            планового аудита.
          </h2>
          <p className="lede">
            Расскажите о предприятии — вернёмся с оценкой ситуации и планом
            первых шагов.
          </p>
        </div>
        <div className="contacts__grid">
          <div className="contact">
            <span className="contact__label">Почта</span>
            <a href="mailto:SirensLLC@yandex.ru" className="contact__value">
              SirensLLC@yandex.ru
            </a>
          </div>
          <div className="contact">
            <span className="contact__label">Телефон</span>
            <span className="contact__stack">
              <span>+7 (___) ___-__-__</span>
              <span>+7 (___) ___-__-__</span>
            </span>
          </div>
          <div className="contact">
            <span className="contact__label">Telegram</span>
            <span className="contact__stack">
              <span>@_______</span>
              <span>@_______</span>
            </span>
          </div>
          <div className="contact">
            <span className="contact__label">Адрес</span>
            <span className="contact__value">Москва</span>
          </div>
          <div className="contact">
            <span className="contact__label">Часы работы</span>
            <span className="contact__value">пн–пт, 9:00–18:00</span>
          </div>
        </div>
      </div>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <div className="form__head">
          <span className="form__title">Заявка</span>
          <span className="form__promise">Ответим за 1 день</span>
        </div>
        <label className="field">
          <span className="field__label">
            <span className="field__n">01</span>Имя
          </span>
          <input name="name" placeholder="Как к вам обращаться" />
        </label>
        <label className="field">
          <span className="field__label">
            <span className="field__n">02</span>Почта
          </span>
          <input name="email" type="email" placeholder="name@company.ru" />
        </label>
        <label className="field">
          <span className="field__label">
            <span className="field__n">03</span>Телефон
          </span>
          <input name="phone" type="tel" placeholder="+7 (___) ___-__-__" />
        </label>
        <label className="consent">
          <input type="checkbox" name="consent" />
          Согласен на обработку персональных данных
        </label>
        <button type="submit" className="submit">
          {sent ? "Заявка отправлена" : "Отправить"}
          <span className="submit__arrow">↗</span>
        </button>
      </form>
    </section>
  );
}
