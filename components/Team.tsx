type IconName = "briefcase" | "clock" | "shield" | "award" | "wrench" | "cap" | "book";

/** Строка-факт: значок, выделенное значение и короткое пояснение. */
type Fact = { icon: IconName; value: string; label?: string };

type Member = {
  photo: string | null;
  photoAlt: string;
  placeholder: string;
  name: string;
  /** направление — одна строка под именем */
  role: string;
  /** четыре факта со значками; всё взято из брифа */
  facts: Fact[];
};

/**
 * photo: положите файл в public/assets/team/ и укажите путь.
 */
const MEMBERS: Member[] = [
  {
    photo: "/assets/team/natalia-sirens-premium.png",
    photoAlt: "Наталья Чистякова",
    placeholder: "Фото — Наталья Чистякова",
    name: "Наталья Чистякова",
    role: "Охрана труда и промышленная безопасность",
    facts: [
      { icon: "briefcase", value: "EY / Б1 Консалт" },
      { icon: "clock", value: "6+ лет", label: "в охране труда" },
      { icon: "shield", value: "20+", label: "предприятий прошли аудит" },
      { icon: "award", value: "ISO 45001 и 14001", label: "аудитор" },
    ],
  },
  {
    photo: "/assets/team/anastasia-sirens-premium.png",
    photoAlt: "Анастасия Шишмарева",
    placeholder: "Фото — Анастасия Шишмарева",
    name: "Анастасия Шишмарева",
    role: "Системы управления и бизнес-процессы",
    facts: [
      { icon: "briefcase", value: "Лукойл Лубрикантс", label: "Казахстан" },
      { icon: "wrench", value: "Инженер", label: "по образованию" },
      { icon: "cap", value: "РГУ им. Губкина", label: "магистратура" },
      { icon: "book", value: "МГТУ им. Баумана", label: "доп. образование" },
    ],
  },
];

/**
 * Рамка каждого значка подогнана под габарит рисунка (замерено getBBox),
 * чтобы крупная сторона у всех выходила одного размера. Без этого ключ
 * смотрелся мельче, а шапочка и книга — крупнее остальных.
 */
const VIEWBOX: Record<IconName, string> = {
  briefcase: "2 1.5 20 20",
  clock: "2 2 20 20",
  shield: "2 2 20 20",
  award: "2.25 2.5 19.5 19.5",
  wrench: "2 4.84 17.16 17.16",
  cap: "1 0.75 22 22",
  book: "1 1.5 22 22",
};

/** Линейные значки, обводка наследует цвет текста. */
const ICONS: Record<IconName, React.ReactNode> = {
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-1.5 7.5 5-2.8 5 2.8-1.5-7.5" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5Z" />
  ),
  cap: (
    <>
      <path d="M2 9.5 12 4.5l10 5-10 5-10-5Z" />
      <path d="M6 11.5v4.5c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    </>
  ),
  book: (
    <>
      <path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2Z" />
      <path d="M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7Z" />
    </>
  ),
};

export default function Team() {
  return (
    <section id="team" className="team">
      <div className="section-head">
        <div className="section-head__left">
          <div className="eyebrow">Команда</div>
          <h2 className="section-title">Кто стоит за SIRENS.</h2>
        </div>
        <p className="lede">
          Две основательницы с опытом в аудите, промышленной безопасности и
          внедрении систем управления.
        </p>
      </div>
      <div className="team__grid">
        {MEMBERS.map((m) => (
          <div className="member" key={m.name}>
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
              <ul className="member__facts">
                {m.facts.map((f) => (
                  <li className="member__fact" key={f.value}>
                    <svg
                      className="member__fact-icon"
                      viewBox={VIEWBOX[f.icon]}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {ICONS[f.icon]}
                    </svg>
                    <span>
                      <b className="member__fact-value">{f.value}</b>
                      {f.label ? ` ${f.label}` : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
