import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-grotesk",
  display: "swap",
  // В Space Grotesk нет кириллицы: заголовки на русском должны падать
  // в системный sans-serif ровно так же, как в макете.
  adjustFontFallback: false,
});

/**
 * Ранний скрипт, до первой отрисовки:
 * - is-preloading показывает прелоадер и запирает скролл;
 * - reveal-ready прячет текст до анимации появления (кроме «уменьшить движение»);
 * - если React не ожил за 6 секунд, всё снимается аварийно, чтобы сайт не
 *   остался под шторкой. Без JavaScript классов нет — прелоадер скрыт, текст виден.
 */
const BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('is-preloading');var r=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(!r)d.classList.add('reveal-ready');setTimeout(function(){if(!window.__sirensBoot){d.classList.remove('is-preloading','reveal-ready');d.classList.add('is-loaded','boot-failed');}},6000);})();`;

export const metadata: Metadata = {
  title: "SIRENS.AI — голос безопасности нового времени",
  description:
    "Охрана труда как работающая система управления бизнес-рисками. Выстраиваем системы управления охраной труда и производственной безопасностью и интегрируем их в бизнес-процессы.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${spaceGrotesk.variable}`}
      // классы прелоадера ставит ранний скрипт до гидратации
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
