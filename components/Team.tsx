"use client";

import { useEffect, useState } from "react";

type Member = {
  photo: string | null;
  photoAlt: string;
  placeholder: string;
  name: string;
  /** должность — одна строка под именем */
  role: string;
  /** короткая выжимка на карточке, вместо прежних значков-фактов */
  summary: string;
  /** развёрнутый опыт — показывается в отдельном окне по клику */
  bio: string[];
};

/**
 * photo: положите файл в public/assets/team/ и укажите путь.
 * Тексты ролей, выжимок и биографий — из правок заказчика от 20.09.2026.
 */
const MEMBERS: Member[] = [
  {
    photo: "/assets/team/natalia-sirens.jpg",
    photoAlt: "Наталья Чистякова",
    placeholder: "Фото\u00a0— Наталья Чистякова",
    name: "Наталья Чистякова",
    role: "Эксперт по\u00a0охране труда и\u00a0промышленной безопасности",
    summary:
      "Глубокая отраслевая экспертиза в\u00a0ОТиПБ, аудит, консалтинг, ISO, HSE due diligence и\u00a0построение систем управления для\u00a0крупных промышленных компаний.",
    bio: [
      "Более 6\u00a0лет помогает промышленным компаниям выстраивать современные системы охраны труда и\u00a0промышленной безопасности.",
      "Имеет опыт работы в\u00a0ведущих международных консалтинговых компаниях большой четвёрки (EY, Б1\u00a0Консалт).",
      "Проводила диагностику и\u00a0аудит систем управления ОТиПБ более чем\u00a0для\u00a020\u00a0предприятий нефтегазовой, золотодобывающей, химической, фармацевтической и\u00a0других отраслей промышленности.",
      "Участвовала в\u00a0проектах по\u00a0HSE и\u00a0ESG due diligence для\u00a0промышленных активов на\u00a0Ближнем Востоке и\u00a0в\u00a0странах СНГ. Разрабатывала программу централизации функции ОТиПБ для\u00a0одной из\u00a0крупнейших золотодобывающих компаний России.",
      "Сертифицированный аудитор ISO 45001\u00a0и\u00a0ISO 14001. Магистр РГУ нефти и\u00a0газа имени И.\u00a0М.\u00a0Губкина.",
    ],
  },
  {
    photo: "/assets/team/anastasia-sirens-premium.png",
    photoAlt: "Анастасия Шишмарева",
    placeholder: "Фото\u00a0— Анастасия Шишмарева",
    name: "Анастасия Шишмарева",
    role: "Эксперт по\u00a0системам управления охраной труда и\u00a0бизнес-процессам",
    summary:
      "Инженерная база в\u00a0ОТиПБ, производственный опыт, экспертиза в\u00a0области управления бизнес-процессами, цифровой трансформации и\u00a0внедрения эффективных систем управления.",
    // текст биографии — от Анастасии, 08.10.2026
    bio: [
      "Инженер по\u00a0производственной и\u00a0техносферной безопасности. Работала в\u00a0охране труда на\u00a0производственных объектах, в\u00a0том числе в\u00a0«Лукойл Лубрикантс Казахстан»: разрабатывала нормативную документацию, оценивала профессиональные риски, сопровождала специальную оценку условий труда.",
      "В\u00a0международной инвестиционной компании выстраивала бизнес-процессы: анализировала и\u00a0оптимизировала процессы, вела проекты цифровой трансформации, готовила аналитику для\u00a0управленческих решений.",
      "В\u00a0«SirenS» объединяет оба опыта: выстраивает охрану труда как\u00a0управляемую систему с\u00a0понятными процессами, ответственными, метриками и\u00a0экономикой.",
      "Магистр РГУ нефти и\u00a0газа имени И.\u00a0М.\u00a0Губкина. Повышение квалификации по\u00a0программе «Инновационные финансовые технологии» в\u00a0МГТУ имени Н.\u00a0Э.\u00a0Баумана.",
    ],
  },
];

export default function Team() {
  const [openName, setOpenName] = useState<string | null>(null);
  const open = MEMBERS.find((m) => m.name === openName) ?? null;

  // Пока окно открыто — Esc закрывает, страница под ним не прокручивается.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenName(null);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section id="team" className="team">
      <div className="section-head">
        <div className="section-head__left">
          <div className="eyebrow">Команда</div>
          <h2 className="section-title">Кто стоит за&nbsp;SIRENS.</h2>
        </div>
        <p className="lede">
          Мы объединили экспертизу, чтобы охрана труда работала на&nbsp;бизнес.
          SIRENS&nbsp;— консалтинговая компания, которая помогает выстраивать
          современные системы охраны труда и&nbsp;производственной безопасности.
        </p>
      </div>
      <div className="team__grid">
        {MEMBERS.map((m) => (
          <article className="member" key={m.name}>
            <div className="member__photo">
              {m.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photo} alt={m.photoAlt} />
              ) : (
                <div className="member__placeholder">{m.placeholder}</div>
              )}
            </div>
            <div className="member__scrim" />
            <div className="member__top">
              <span className="member__label">Соучредитель</span>
            </div>
            <div className="member__body">
              <div className="member__name">{m.name}</div>
              <div className="member__role">{m.role}</div>
              <p className="member__summary">{m.summary}</p>
              {/* кнопка растянута на всю карточку через ::after — кликается
                  любое место фото, но для клавиатуры это одна цель */}
              <button
                type="button"
                className="member__open"
                onClick={() => setOpenName(m.name)}
              >
                Подробнее об&nbsp;опыте
                <span className="member__open-arrow">↗</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Итог по команде — под фотографиями, как просил заказчик: панель
          в стиле карточек, слева ярлык и тезис, справа сам текст. */}
      <div className="team__summary">
        <div className="team__summary-head">
          <div className="eyebrow">Почему это работает</div>
          <div className="team__summary-title">
            Две экспертизы&nbsp;— одна система
          </div>
        </div>
        <p className="team__summary-text">
          Мы объединяем глубокую отраслевую экспертизу в&nbsp;ОТиПБ с&nbsp;опытом управления
          бизнес-процессами и&nbsp;цифровой трансформации. Благодаря этому наши решения
          не&nbsp;ограничиваются разработкой документов или&nbsp;соблюдением требований
          законодательства&nbsp;— мы создаём системы, которые легко внедряются в&nbsp;работу
          компании, снижают риски и&nbsp;поддерживают устойчивое развитие бизнеса.
        </p>
      </div>

      {open && (
        <div
          className="bio"
          role="dialog"
          aria-modal="true"
          aria-label={`Опыт — ${open.name}`}
          onClick={() => setOpenName(null)}
        >
          <div className="bio__panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="bio__close"
              aria-label="Закрыть"
              onClick={() => setOpenName(null)}
            >
              ✕
            </button>
            <div className="bio__label">Соучредитель</div>
            <div className="bio__name">{open.name}</div>
            <div className="bio__role">{open.role}</div>
            <div className="bio__text">
              {open.bio.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
