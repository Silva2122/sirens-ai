import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { METRIKA_ON } from "@/lib/features";

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
 * - загрузка ролика первого экрана стартует отсюда же (window.__sirensHero):
 *   <link rel=preload as=fetch> не годится — Safari не отдаёт его в fetch()
 *   и качает файл второй раз параллельно; HeroScroll ждёт этот промис;
 * - is-preloading показывает прелоадер и запирает скролл;
 * - reveal-ready прячет текст до анимации появления (кроме «уменьшить движение»);
 * - если React не ожил за 6 секунд, всё снимается аварийно, чтобы сайт не
 *   остался под шторкой. Без JavaScript классов нет — прелоадер скрыт, текст виден.
 */
const BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('is-preloading');var r=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(!r)d.classList.add('reveal-ready');if(!r&&window.fetch&&window.matchMedia){var u=window.matchMedia('(max-aspect-ratio: 5/4)').matches?'/assets/hero-beacon-m.mp4':'/assets/hero-beacon.mp4';window.__sirensHero={url:u,blob:fetch(u).then(function(x){return x.ok?x.blob():Promise.reject(x.status)})};}setTimeout(function(){if(!window.__sirensBoot){d.classList.remove('is-preloading','reveal-ready');d.classList.add('is-loaded','boot-failed');}},6000);})();`;

/**
 * Яндекс Метрика — только на боевом сайте: в разработке и на превью GitHub Pages
 * (там задан PAGES_BASE_PATH) счётчик не подключается, чтобы не портить статистику.
 * Сейчас выключена и на боевом — см. lib/features.ts.
 */
const METRIKA_ID = 114023021;
const METRIKA_ENABLED =
  METRIKA_ON && process.env.NODE_ENV === "production" && !process.env.PAGES_BASE_PATH;
const METRIKA_SCRIPT = `(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}', 'ym');

ym(${METRIKA_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`;

export const metadata: Metadata = {
  title: "SIRENS — голос безопасности нового времени",
  description:
    "Услуги в области охраны труда. Выстраиваем и развиваем системы управления охраной труда и производственной безопасностью, интегрируя их в бизнес-процессы и помогая снижать производственные и финансовые риски.",
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
        {METRIKA_ENABLED && (
          <script dangerouslySetInnerHTML={{ __html: METRIKA_SCRIPT }} />
        )}
      </head>
      <body>
        {children}
        {METRIKA_ENABLED && (
          <noscript>
            <div>
              {/* Пиксель из кода счётчика: инлайновый стиль оставлен как у Яндекса */}
              <img
                src={`https://mc.yandex.ru/watch/${METRIKA_ID}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        )}
      </body>
    </html>
  );
}
