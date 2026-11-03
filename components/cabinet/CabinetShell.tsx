"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import CabIcon, { type CabIconName } from "@/components/cabinet/CabIcons";
import { currentUser, listTestResults, logout, type User } from "@/lib/api";
import { texts } from "@/lib/assessment";

const UserContext = createContext<User | null>(null);

/** Текущий пользователь внутри кабинета — оболочка гарантирует, что он есть. */
export function useCabinetUser(): User {
  const user = useContext(UserContext);
  if (!user) throw new Error("useCabinetUser вне CabinetShell");
  return user;
}

/** Разделы кабинета в меню. */
const TABS: { href: string; label: string; icon: CabIconName }[] = [
  { href: "/cabinet/", label: "Дашборд", icon: "dashboard" },
  { href: "/cabinet/test/", label: "Опросник", icon: "test" },
];

/** Инициалы для аватара: «Мария Демидова» → «МД». */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/**
 * Оболочка кабинета: меню слева с карточкой «Разбор с экспертом», шапка
 * с пользователем, содержимое. Без входа отправляет на страницу логина.
 * Проверка сессии клиентская — сервера у статического сайта нет; когда
 * появится бэкенд, доступ будет решать он.
 */
export default function CabinetShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  // запись на разбор живёт на странице результата — ведём на последний
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    void currentUser().then((u) => (u ? setUser(u) : router.replace("/cabinet/login/")));
  }, [router]);

  useEffect(() => {
    if (user) void listTestResults().then((t) => setLastResult(t[0]?.id ?? null));
  }, [user, pathname]);

  const exit = async () => {
    await logout();
    router.replace("/cabinet/login/");
  };

  if (!user) return <div className="cab cab--loading" aria-busy="true" />;

  return (
    <UserContext.Provider value={user}>
      <div className="cab">
        <aside className="cab__side">
          <Link href="/" className="logo cab__logo">
            SIRENS<span className="logo__dot">.</span>
          </Link>
          <span className="cab__group">Меню</span>
          <nav className="cab__nav">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="cab__tab"
                data-active={pathname === t.href || pathname === t.href.slice(0, -1) ? "1" : "0"}
              >
                <CabIcon name={t.icon} />
                {t.label}
              </Link>
            ))}
          </nav>
          <span className="cab__group">Общее</span>
          <nav className="cab__nav">
            <Link href="/" className="cab__tab">
              <CabIcon name="site" />
              Сайт SIRENS
            </Link>
            <button type="button" className="cab__tab" onClick={exit}>
              <CabIcon name="exit" />
              Выйти
            </button>
          </nav>

          <div className="cab__promo">
            <span className="cab__promo-rings" aria-hidden="true" />
            <span className="cab__promo-title">{texts.b7_title}</span>
            <span className="cab__promo-text">{texts.b7_role_other}</span>
            <Link
              href={lastResult ? `/cabinet/result/?id=${lastResult}#expert` : "/cabinet/test/"}
              className="cab__promo-btn"
            >
              {lastResult ? "Записаться" : "Сначала опросник"}
            </Link>
          </div>
        </aside>
        <div className="cab__main">
          <header className="cab__top">
            <div className="cab__crumb">
              <span className="cab__crumb-label">Личный кабинет</span>
              <span className="cab__crumb-company">{user.company}</span>
            </div>
            <div className="cab__user">
              <span className="cab__avatar" aria-hidden="true">
                {initials(user.name)}
              </span>
              <span className="cab__user-text">
                <span className="cab__user-name">{user.name}</span>
                <span className="cab__user-role">{user.position}</span>
              </span>
            </div>
          </header>
          <main className="cab__content">{children}</main>
        </div>
      </div>
    </UserContext.Provider>
  );
}
