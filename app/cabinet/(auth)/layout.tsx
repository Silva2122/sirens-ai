import Link from "next/link";
import CabIcon, { type CabIconName } from "@/components/cabinet/CabIcons";

/** Что ждёт в кабинете — три пункта слева от формы. */
const FEATURES: { icon: CabIconName; title: string; text: string }[] = [
  { icon: "bars", title: "Профиль SIRENS", text: "Оценка по шести направлениям и уровень зрелости" },
  { icon: "target", title: "План на 90 дней", text: "Три первоочередных действия и дорожная карта" },
  { icon: "user", title: "Разбор с экспертом", text: "Расшифровка результата и обоснование плана" },
];

/**
 * Вход и регистрация в стиле кабинета: слева панель, как меню кабинета, —
 * логотип и что внутри; справа карточка с формой.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth">
      <aside className="auth__intro">
        <span className="auth__rings" aria-hidden="true" />
        <Link href="/" className="logo auth__logo">
          SIRENS<span className="logo__dot">.</span>
        </Link>
        <div className="auth__lead">
          <h1 className="dash__title">Личный кабинет</h1>
          <p className="dash__sub">Оценка культуры безопасности вашей компании и&nbsp;план её развития.</p>
        </div>
        <ul className="auth__features">
          {FEATURES.map((f) => (
            <li key={f.title} className="auth__feature">
              <span className="tile__icon">
                <CabIcon name={f.icon} />
              </span>
              <span className="auth__feature-text">
                <span className="auth__feature-title">{f.title}</span>
                <span className="tile__meta">{f.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <Link href="/" className="auth__back">
          ← На&nbsp;сайт
        </Link>
      </aside>
      <section className="auth__main">{children}</section>
    </main>
  );
}
