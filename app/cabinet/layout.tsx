import type { Metadata } from "next";
import BootReset from "@/components/cabinet/BootReset";
import LegalModal from "@/components/LegalModal";

export const metadata: Metadata = {
  title: "Личный кабинет — SIRENS",
  robots: { index: false, follow: false },
};

/**
 * Личный кабинет: вход, регистрация, дашборд с полным тестом. Страницы
 * клиентские — статический экспорт сервера не имеет, данные пока в заглушке
 * lib/api.ts.
 */
export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cab-root">
      <BootReset />
      {children}
      <LegalModal />
    </div>
  );
}
