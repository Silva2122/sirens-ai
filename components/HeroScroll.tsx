"use client";

import { useEffect, useRef } from "react";
import { applyLeader, elbowLeader } from "@/lib/leaders";

/** Три направления. Разбросаны вокруг лампы, каждая со стрелкой к ней. */
const CARDS = [
  {
    n: "01",
    title: "Требования законодательства",
    text: "Документация, подготовка к ГИТ, аудит СУОТ, оценка рисков, аутсорсинг ОТ.",
    art: "legal",
    place: "tl",
  },
  {
    n: "02",
    title: "Финансовые инструменты",
    text: "Скидка к тарифу СФР, аудит экономических потерь.",
    art: "finance",
    place: "bl",
  },
  {
    n: "03",
    title: "Технические системы",
    text: "Внедрение LOTO, SaaS-платформа ИИ для производственной безопасности.",
    art: "tech",
    place: "r",
  },
];

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

/**
 * Где лампа в кадре по ходу ролика: доля ширины, доля высоты и радиус свечения
 * в долях ширины. Снято покадрово с самого ролика — камера не просто наезжает,
 * в середине лампа заметно уходит влево и возвращается.
 */
const LAMP_TRACK: [number, number, number, number][] = [
  [0.0, 0.64, 0.409, 0.3],
  [0.125, 0.635, 0.409, 0.31],
  [0.156, 0.627, 0.404, 0.32],
  [0.188, 0.588, 0.396, 0.35],
  [0.219, 0.525, 0.391, 0.39],
  [0.25, 0.458, 0.387, 0.42],
  [0.281, 0.41, 0.387, 0.44],
  [0.312, 0.4, 0.382, 0.45],
  [0.344, 0.405, 0.382, 0.45],
  [0.375, 0.425, 0.387, 0.44],
  [0.406, 0.468, 0.387, 0.43],
  [0.438, 0.477, 0.382, 0.42],
  [0.5, 0.482, 0.4, 0.43],
  [0.562, 0.49, 0.413, 0.44],
  [0.625, 0.492, 0.409, 0.44],
  [0.688, 0.487, 0.436, 0.46],
  [0.75, 0.492, 0.44, 0.47],
  [0.875, 0.492, 0.44, 0.48],
  [1.0, 0.492, 0.444, 0.5],
];

const lampAt = (p: number) => {
  let i = 1;
  while (i < LAMP_TRACK.length - 1 && LAMP_TRACK[i][0] < p) i += 1;
  const [p0, x0, y0, r0] = LAMP_TRACK[i - 1];
  const [p1, x1, y1, r1] = LAMP_TRACK[i];
  const k = p1 === p0 ? 0 : clamp((p - p0) / (p1 - p0));
  return {
    x: x0 + (x1 - x0) * k,
    y: y0 + (y1 - y0) * k,
    r: r0 + (r1 - r0) * k,
  };
};

/** Плавное нарастание на отрезке [from, to] прогресса сцены. */
const ramp = (p: number, from: number, to: number) =>
  clamp((p - from) / (to - from));

/**
 * Первый экран: видео с маячком, привязанное к скроллу.
 * Пока листаем, ролик отматывается от первого кадра к последнему, заголовок
 * уходит, а на финальном кадре проявляются три карточки направлений.
 *
 * На узких экранах и при prefers-reduced-motion сцена разбирается в обычный
 * первый экран с зациклённым видео и блок карточек под ним.
 */
export default function HeroScroll() {
  const stageRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const arrowsRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!stage || !video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 900px)");

    let mode: "scrub" | "loop" = "scrub";
    let rafId = 0;
    let queued = false;

    const frameSource = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (
        cb: (now: number, meta: { mediaTime: number }) => void
      ) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };
    const hasFrameCallback =
      typeof frameSource.requestVideoFrameCallback === "function";
    let frameHandle = 0;

    const onFrame = (_now: number, meta: { mediaTime: number }) => {
      if (video.duration) placeGlow(clamp(meta.mediaTime / video.duration));
      frameHandle = frameSource.requestVideoFrameCallback!(onFrame);
    };

    const applySimple = () => {
      stage.dataset.mode = "loop";
      video.loop = true;
      video.autoplay = true;
      if (!video.src.endsWith("hero-beacon-loop.mp4")) {
        video.src = "/assets/hero-beacon-loop.mp4";
      }
      if (!reduced.matches) void video.play().catch(() => {});
      stage.style.removeProperty("--p");
      stage.dataset.idle = "1";
      stage.style.setProperty("--glow-o", "1");
    };

    const onTimeUpdate = () => {
      if (mode !== "loop" || hasFrameCallback || !video.duration) return;
      placeGlow(clamp(video.currentTime / video.duration));
    };

    const applyScrub = () => {
      stage.dataset.mode = "scrub";
      video.loop = false;
      video.autoplay = false;
      video.pause();
      if (!video.src.endsWith("hero-beacon.mp4")) {
        video.src = "/assets/hero-beacon.mp4";
      }
      update();
    };

    function update() {
      if (!stage || !video) return;
      queued = false;
      const rect = stage.getBoundingClientRect();
      const travel = stage.offsetHeight - window.innerHeight;
      const p = travel > 0 ? clamp(-rect.top / travel) : 0;

      stage.style.setProperty("--p", p.toFixed(4));
      stage.style.setProperty("--copy-o", (1 - ramp(p, 0.02, 0.26)).toFixed(3));
      stage.style.setProperty("--copy-y", `${ramp(p, 0.02, 0.26) * -70}px`);
      stage.style.setProperty("--stats-o", (1 - ramp(p, 0, 0.18)).toFixed(3));
      // левая шторка нужна только под заголовок — дальше открываем кадр
      stage.style.setProperty("--scrim-o", (1 - ramp(p, 0.1, 0.5)).toFixed(3));
      // пульсация свечения — только пока страницу не тронули
      stage.dataset.idle = p < 0.015 ? "1" : "0";
      // ближе к финалу лампа и так занимает кадр — ореол убавляем
      stage.style.setProperty(
        "--glow-o",
        (1 - ramp(p, 0.3, 1) * 0.45).toFixed(3)
      );
      // если браузер умеет отдавать время показанного кадра, ореол ведём по нему:
      // перемотка асинхронная, и по позиции скролла свет обгонял бы картинку
      if (!hasFrameCallback) placeGlow(p);

      const cards = stage.querySelectorAll<HTMLElement>("[data-card]");
      cards.forEach((card, i) => {
        const cp = ramp(p, 0.56 + i * 0.06, 0.84 + i * 0.06);
        card.style.setProperty("--c-o", cp.toFixed(3));
        card.style.setProperty("--c-y", `${(1 - cp) * 90}px`);
      });
      drawArrows(cards);

      const duration = video.duration;
      if (Number.isFinite(duration) && duration > 0) {
        const t = p * duration * 0.999;
        if (Math.abs(video.currentTime - t) > 1 / 48) {
          try {
            video.currentTime = t;
          } catch {
            /* сиденье ещё не готово — поймаем на следующем кадре */
          }
        }
      }
    }

    /**
     * Выноски от карточек к лампе — та же геометрия, что в блоке «Философия».
     * Ролик вписан по cover без сдвига, поэтому лампа финального кадра
     * приходится ровно на центр сцены: туда и целимся.
     */
    function drawArrows(cards: NodeListOf<HTMLElement>) {
      const svg = arrowsRef.current;
      const sticky = svg?.parentElement;
      if (!svg || !sticky) return;

      const box = sticky.getBoundingClientRect();
      const w = box.width;
      const h = box.height;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      // габарит лампы в координатах ролика 1600×900, масштаб общий с cover
      const scale = Math.max(w / 1600, h / 900);
      const lamp = {
        cx: w / 2,
        cy: h / 2,
        a: 232 * scale,
        b: 288 * scale,
      };

      const groups = svg.querySelectorAll<SVGGElement>("[data-leader]");
      const grads = svg.querySelectorAll("[data-leader-grad]");

      cards.forEach((card, i) => {
        const g = groups[i];
        if (!g) return;
        const r = card.getBoundingClientRect();
        const leader = elbowLeader(
          {
            left: r.left - box.left,
            top: r.top - box.top,
            right: r.right - box.left,
            bottom: r.bottom - box.top,
          },
          lamp,
          36 * scale
        );
        applyLeader(g, grads[i], leader);
        if (leader) {
          g.setAttribute(
            "opacity",
            card.style.getPropertyValue("--c-o") || "0"
          );
        }
      });
    }

    /** Ставит ореол туда, где сейчас лампа, и масштабирует его под кадр. */
    function placeGlow(p: number) {
      if (!stage) return;
      const box = stage.getBoundingClientRect();
      const w = box.width;
      const h = Math.min(box.height, window.innerHeight);
      const scale = Math.max(w / 1600, h / 900);
      const ox = (w - 1600 * scale) / 2;
      const oy = (h - 900 * scale) / 2;
      const l = lampAt(p);
      const gr = l.r * 1600 * scale;
      stage.style.setProperty("--gx", `${(ox + l.x * 1600 * scale).toFixed(1)}px`);
      stage.style.setProperty("--gy", `${(oy + l.y * 900 * scale).toFixed(1)}px`);
      stage.style.setProperty("--gr", `${gr.toFixed(1)}px`);
      stage.style.setProperty("--gr-core", `${(gr * 0.42).toFixed(1)}px`);
    }

    const onScroll = () => {
      if (mode !== "scrub" || queued) return;
      queued = true;
      rafId = requestAnimationFrame(update);
    };

    const pickMode = () => {
      mode = reduced.matches || narrow.matches ? "loop" : "scrub";
      if (mode === "loop") applySimple();
      else applyScrub();
    };

    pickMode();
    placeGlow(0);
    if (hasFrameCallback) {
      frameHandle = frameSource.requestVideoFrameCallback!(onFrame);
    }
    video.addEventListener("loadedmetadata", update);
    video.addEventListener("timeupdate", onTimeUpdate);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    reduced.addEventListener("change", pickMode);
    narrow.addEventListener("change", pickMode);

    return () => {
      cancelAnimationFrame(rafId);
      if (frameHandle) frameSource.cancelVideoFrameCallback?.(frameHandle);
      video.removeEventListener("loadedmetadata", update);
      video.removeEventListener("timeupdate", onTimeUpdate);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      reduced.removeEventListener("change", pickMode);
      narrow.removeEventListener("change", pickMode);
    };
  }, []);

  return (
    <section id="top" className="stage" ref={stageRef} data-mode="scrub">
      <div className="stage__sticky">
        <div className="stage__media">
          {/* см. Contacts.tsx: расширения браузера дописывают классы в <video> */}
          <video
            ref={videoRef}
            className="stage__video"
            suppressHydrationWarning
            poster="/assets/hero-beacon-poster.jpg"
            preload="auto"
            muted
            playsInline
            aria-hidden="true"
          />
          <div className="stage__bloom" />
          <div className="stage__noise" />
          <div className="stage__scrim" />
          <div className="stage__fade" />
        </div>

        <div className="stage__body">
          <div className="stage__copy">
            <h1 className="hero__title">
              Голос
              <br />
              безопасности
              <br />
              нового времени
            </h1>
            <p className="lede">
              Охрана труда как работающая система управления бизнес-рисками.
              Выстраиваем системы управления охраной труда и производственной
              безопасностью и интегрируем их в бизнес-процессы.
            </p>
            <a href="#contacts" className="cta cta--lg">
              Оставить заявку
              <span className="cta__arrow">↗</span>
            </a>
          </div>
        </div>

        <div className="stage__stats">
          <div className="stat stat--signal" data-glass="tilt">
            <svg
              className="stat__icon"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3 3 7v5c0 5 3.8 8.4 9 9 5.2-.6 9-4 9-9V7l-9-4Z" />
              <path d="m8.5 12 2.5 2.5 4.5-5" />
            </svg>
            <div className="stat__body">
              <div className="stat__value">20+</div>
              <div className="stat__label">предприятий прошли аудит</div>
            </div>
          </div>
          <div className="stat stat--plain" data-glass="tilt">
            <svg
              className="stat__icon"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M8 9h8M8 13h5" />
            </svg>
            <div className="stat__body">
              <div className="stat__value">10</div>
              <div className="stat__label">услуг в трёх направлениях</div>
            </div>
          </div>
        </div>

        <svg className="stage__arrows" ref={arrowsRef} aria-hidden="true">
          <defs>
            {CARDS.map((card, i) => (
              <linearGradient
                key={card.n}
                id={`lead-${i}`}
                data-leader-grad
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="55%" stopColor="rgba(255,255,255,0.45)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.75)" />
              </linearGradient>
            ))}
          </defs>
          {CARDS.map((card, i) => (
            <g data-leader key={card.n} opacity="0">
              <path
                data-leader-line
                className="lead__line"
                stroke={`url(#lead-${i})`}
              />
              <circle data-leader-dot className="lead__dot" r="4" />
            </g>
          ))}
        </svg>

        <div className="stage__cards">
          {CARDS.map((card) => (
            <div
              className={`beacon-card beacon-card--${card.place}`}
              data-card
              data-glass="flat"
              key={card.n}
            >
              <div className={`beacon-card__art beacon-card__art--${card.art}`} />
              <div className="beacon-card__body">
                <div className="beacon-card__n">{card.n}</div>
                <div className="beacon-card__title">{card.title}</div>
                <div className="beacon-card__text">{card.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
