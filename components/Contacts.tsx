"use client";

import { useEffect, useRef } from "react";
import LeadForm from "@/components/LeadForm";
import { founders } from "@/lib/content";

export default function Contacts() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Фоновый ролик крутится сам, но при prefers-reduced-motion замирает на постере.
  // Источник подставляем, только когда подвал подходит к экрану: иначе ролик
  // качался с первых секунд и отбирал канал у видео первого экрана.
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

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        video.src = "/assets/contacts-beacon.mp4";
        apply();
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(video);

    media.addEventListener("change", apply);
    return () => {
      io.disconnect();
      media.removeEventListener("change", apply);
    };
  }, []);

  return (
    <section id="contacts" className="contacts">
      {/* suppressHydrationWarning: браузерные расширения для видео (VLC и т.п.)
          дописывают свои классы в <video> до гидрации — это не наша разметка. */}
      <video
        ref={videoRef}
        className="contacts__video"
        suppressHydrationWarning
        poster="/assets/contacts-beacon-poster.jpg"
        loop
        muted
        playsInline
        preload="none"
        aria-hidden="true"
      />
      <div className="contacts__scrim" />
      <div className="contacts__fade" />

      <div className="contacts__left">
        <div className="contacts__head">
          <div className="eyebrow">Контакты</div>
          <h2 className="section-title">
            Риск не&nbsp;ждёт
            <br />
            планового аудита.
          </h2>
          <p className="lede">
            Расскажите о&nbsp;предприятии&nbsp;— вернёмся с&nbsp;оценкой ситуации и&nbsp;планом
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
              {founders.map((f) => (
                <a href={`tel:${f.tel}`} className="contact__value" key={f.tel}>
                  {f.phone}
                </a>
              ))}
            </span>
          </div>
          <div className="contact">
            <span className="contact__label">Telegram</span>
            <span className="contact__stack">
              {founders.map((f) => (
                <a
                  href={`https://t.me/${f.telegram}`}
                  className="contact__value"
                  target="_blank"
                  rel="noopener noreferrer"
                  key={f.telegram}
                >
                  @{f.telegram}
                </a>
              ))}
            </span>
          </div>
          <div className="contact">
            <span className="contact__label">Адрес</span>
            <span className="contact__value">
              Москва, ул.&nbsp;Дмитрия Ульянова, 31, 55/4
              <br />
              м.&nbsp;Академическая
            </span>
          </div>
          <div className="contact">
            <span className="contact__label">Часы работы</span>
            <span className="contact__value">пн–пт, 9:00–18:00</span>
          </div>
        </div>
      </div>

      <LeadForm />
    </section>
  );
}
