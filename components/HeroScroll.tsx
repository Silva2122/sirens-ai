"use client";

import { useEffect, useRef } from "react";
import CtaButton from "@/components/CtaButton";
import { applyLeader, elbowLeader } from "@/lib/leaders";

/**
 * Три направления вокруг лампы, каждая со стрелкой к ней. Верхний левый угол
 * занят заголовком, поэтому 01 стоит слева под ним, 02 и 03 — справа
 * сверху и снизу: читается по часовой стрелке.
 */
const CARDS = [
  {
    n: "01",
    title: "Соблюдение требований законодательства",
    text: "Документация, подготовка к\u00a0ГИТ, аудит СУОТ, оценка рисков, аутсорсинг ОТ.",
    art: "legal",
    place: "l",
  },
  {
    n: "02",
    title: "Финансовые инструменты",
    text: "Скидка к\u00a0тарифу СФР, аудит экономических потерь.",
    art: "finance",
    place: "rt",
  },
  {
    n: "03",
    title: "Технические системы",
    text: "Внедрение LOTO и\u00a0аналогов.",
    art: "tech",
    place: "rb",
  },
];

/** Узлы с выносками к лампе — три карточки; заголовок остаётся просто текстом. */
const LEADERS = CARDS.map((c) => c.n);

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
 * На портретных экранах (телефон) сцена тоже ведётся скроллом, но кадр
 * другой: ролик 16:9 не растягивается по высоте (лампа вышла бы шире экрана),
 * а масштабируется под лампу и панорамируется за ней — data-frame="fit".
 * Карточки направлений там не вокруг лампы, а отдельным блоком, который на
 * финальном кадре выезжает поверх неё снизу.
 *
 * При prefers-reduced-motion сцена разбирается в статичный первый экран
 * с зациклённым видео и карточками под ним.
 */

/** Габарит лампы на финальном кадре в координатах ролика 1600×900. */
const LAMP_A = 232;
const LAMP_B = 288;
/** Какую долю ширины телефона занимает лампа на финальном кадре. */
const FIT_LAMP_W = 0.64;
export default function HeroScroll() {
  const stageRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const arrowsRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!stage || !video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    // портрет и почти квадрат — кадрируем под лампу, иначе cover как в макете
    const portrait = window.matchMedia("(max-aspect-ratio: 5/4)");
    const sticky = stage.firstElementChild as HTMLElement;
    const spacer = stage.querySelector<HTMLElement>(".stage__spacer");

    let mode: "scrub" | "loop" = "scrub";
    let fit = false;
    let rafId = 0;
    let queued = false;
    let blobUrl = "";
    /**
     * Телефон: прогресс сцены не берём со скролла напрямую, а догоняем его
     * с инерцией. Тач-скролл приходит рывками, а перемотка видео отвечает
     * с задержкой — на прямой связке кадр и панорама дёргались по кочкам.
     */
    let target = 0;
    let smooth = 0;
    let smoothId = 0;
    /** перемотка в полёте: следующую выдаём после seeked, иначе декодер захлёбывается */
    let seekBusy = false;
    let seekWant = -1;
    /**
     * Прогресс кадра, который реально на экране. В fit панорама и ореол идут
     * за ним, а не за скроллом: пока ролик не докачался или перемотка
     * отстаёт, кадр стоит на месте — иначе лампа ползла по экрану, не крутясь.
     */
    let shownP = 0;
    let glowP = 0;

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
      if (video.duration) {
        shownP = clamp(meta.mediaTime / video.duration);
        if (!fit) placeGlow(shownP);
      }
      frameHandle = frameSource.requestVideoFrameCallback!(onFrame);
    };

    const applySimple = () => {
      stage.dataset.mode = "loop";
      video.loop = true;
      video.autoplay = true;
      if (video.dataset.src !== "loop") {
        video.dataset.src = "loop";
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
      loadScrub();
      update();
    };

    /**
     * Ролик для перемотки грузим целиком в память и отдаём видео как blob.
     * Телефоны игнорируют preload="auto" и держат в буфере пару секунд, так
     * что каждая перемотка по скроллу уходила в сеть за новым куском — на
     * хостинге это читалось как лаги. Прямую ссылку в <video> до этого не
     * ставим: Safari качал бы файл вторым потоком параллельно с fetch, и оба
     * ползли вдвое дольше (до blob экран держит прелоадер и постер). Прямая
     * ссылка — только если скачать не удалось. В портрете — версия 960×540.
     */
    function loadScrub() {
      const url = fit ? "/assets/hero-beacon-m.mp4" : "/assets/hero-beacon.mp4";
      if (video!.dataset.src === url) return;
      video!.dataset.src = url;
      // ранний скрипт в layout уже начал качать ролик — берём его промис,
      // чтобы не запускать второй поток; свой fetch только если url другой
      const pre = (window as Window & { __sirensHero?: { url: string; blob: Promise<Blob> } })
        .__sirensHero;
      const loading =
        pre && pre.url === url
          ? pre.blob
          : fetch(url).then((r) => (r.ok ? r.blob() : Promise.reject(r.status)));
      loading
        .then((blob) => {
          if (video!.dataset.src !== url) return;
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          blobUrl = URL.createObjectURL(blob);
          video!.src = blobUrl;
        })
        .catch(() => {
          if (video!.dataset.src === url) video!.src = url;
        })
        .finally(heroReady);
    }

    /** Сигнал прелоадеру: ролик в памяти (или уже не дождёмся), можно открывать. */
    function heroReady() {
      const w = window as Window & { __sirensHeroReady?: boolean };
      if (w.__sirensHeroReady) return;
      w.__sirensHeroReady = true;
      window.dispatchEvent(new Event("sirens:hero-ready"));
    }

    /** Смена источника (прямая ссылка → blob) роняет незавершённую перемотку. */
    const onSourceReset = () => {
      seekBusy = false;
      seekWant = -1;
      primed = false;
    };

    /**
     * iOS Safari не декодирует ни кадра, пока видео хоть раз не запускали:
     * перемотка currentTime у «нетронутого» ролика рисует чёрный прямоугольник
     * (на телефонах девчонок лампа после первого экрана пропадала). Поэтому
     * после загрузки источника — короткий play() → pause(). Без звука и inline
     * это разрешено без жеста; если всё же отказал (режим энергосбережения),
     * повторяем на первом касании.
     */
    let primed = false;
    let primeTries = 0;
    function primeDecoder() {
      if (mode !== "scrub" || primed || primeTries > 2) return;
      primeTries += 1;
      const p = video!.play();
      if (!p) return;
      p.then(() => {
        video!.pause();
        primed = true;
        seekBusy = false;
        update();
      }).catch(() => {
        window.addEventListener("touchstart", primeDecoder, { once: true, passive: true });
        window.addEventListener("pointerdown", primeDecoder, { once: true, passive: true });
      });
    }
    const onMeta = () => {
      update();
      primeDecoder();
    };

    function update() {
      if (!stage || !video) return;
      queued = false;
      const rect = stage.getBoundingClientRect();
      // на телефоне длину прокрутки задаёт распорка: дальше поверх финального
      // кадра выезжает блок карточек, и ролик должен уже стоять на месте
      const travel =
        fit && spacer ? spacer.offsetHeight : stage.offsetHeight - window.innerHeight;
      const p = travel > 0 ? clamp(-rect.top / travel) : 0;

      if (fit) {
        target = p;
        if (!smoothId) smoothId = requestAnimationFrame(tick);
        return;
      }
      render(p);
    }

    /**
     * Шаг догонялки: smooth тянется к позиции скролла, glowP — к показанному
     * кадру. Крутимся, пока хоть одна разница заметна.
     */
    function tick() {
      smoothId = 0;
      const d = target - smooth;
      if (Math.abs(d) < 0.0004) smooth = target;
      else smooth += d * 0.2;
      render(smooth);

      const g = shownP - glowP;
      if (Math.abs(g) < 0.0004) glowP = shownP;
      else glowP += g * 0.35;
      if (fit) placeGlow(glowP);

      if (smooth !== target || glowP !== shownP) {
        smoothId = requestAnimationFrame(tick);
      }
    }

    function render(p: number) {
      if (!stage || !video) return;
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
      if (!hasFrameCallback && !fit) placeGlow(p);

      const cards = sticky.querySelectorAll<HTMLElement>("[data-card]");
      cards.forEach((card, i) => {
        const cp = ramp(p, 0.56 + i * 0.06, 0.84 + i * 0.06);
        card.style.setProperty("--c-o", cp.toFixed(3));
        card.style.setProperty("--c-y", `${(1 - cp) * 90}px`);
      });
      // заголовок проявляется чуть раньше первой карточки; его нижний край
      // отдаём в CSS — от него отсчитывается карточка 01 под ним
      const cardsTitle = stage.querySelector<HTMLElement>("[data-cards-title]");
      if (cardsTitle) {
        const tp = ramp(p, 0.5, 0.76);
        cardsTitle.style.setProperty("--c-o", tp.toFixed(3));
        cardsTitle.style.setProperty("--c-y", `${(1 - tp) * 40}px`);
        stage.style.setProperty(
          "--title-bottom",
          `${cardsTitle.offsetTop + cardsTitle.offsetHeight}px`
        );
      }

      drawArrows(cards);

      seekTo(p);
    }

    function seekTo(p: number) {
      const duration = video!.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      const t = p * duration * 0.999;
      if (Math.abs(video!.currentTime - t) <= 1 / 48) return;
      if (seekBusy) {
        seekWant = t;
        return;
      }
      try {
        seekBusy = true;
        seekWant = -1;
        video!.currentTime = t;
      } catch {
        seekBusy = false;
      }
    }

    const onSeeked = () => {
      seekBusy = false;
      if (video.duration) {
        shownP = clamp(video.currentTime / video.duration);
        if (fit && !smoothId) smoothId = requestAnimationFrame(tick);
      }
      if (seekWant >= 0 && video.duration) {
        const p = seekWant / (video.duration * 0.999);
        seekWant = -1;
        seekTo(p);
      }
    };

    /**
     * Выноски от карточек к лампе — та же геометрия, что в блоке «Философия».
     * Ролик вписан по cover без сдвига, поэтому лампа финального кадра
     * приходится ровно на центр сцены: туда и целимся.
     */
    function drawArrows(cards: NodeListOf<HTMLElement>) {
      const svg = arrowsRef.current;
      // на телефоне выносок нет: карточки идут отдельным блоком под сценой
      if (!svg || fit) return;

      const box = sticky.getBoundingClientRect();
      const w = box.width;
      const h = box.height;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      // габарит лампы в координатах ролика 1600×900, масштаб общий с cover
      const scale = Math.max(w / 1600, h / 900);
      const lamp = {
        cx: w / 2,
        cy: h / 2,
        a: LAMP_A * scale,
        b: LAMP_B * scale,
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

    /**
     * Где лежит кадр ролика внутри сцены: масштаб и смещение левого верхнего
     * угла. Cover — по центру, как object-fit. Fit (телефон) — масштаб от
     * ширины лампы, кадр сдвигается так, чтобы лампа стояла по центру и чуть
     * ниже середины; на старте она меньше и ниже, к финалу поднимается.
     */
    function frame(p: number) {
      const w = sticky.clientWidth;
      const h = sticky.clientHeight;
      if (!fit) {
        const scale = Math.max(w / 1600, h / 900);
        return { w, h, scale, ox: (w - 1600 * scale) / 2, oy: (h - 900 * scale) / 2 };
      }
      const scale = Math.min((FIT_LAMP_W * w) / (LAMP_A * 2), h / 900);
      const l = lampAt(p);
      const targetY = 0.72 - 0.16 * p;
      return {
        w,
        h,
        scale,
        ox: w / 2 - l.x * 1600 * scale,
        oy: targetY * h - l.y * 900 * scale,
      };
    }

    /** Ставит ореол туда, где сейчас лампа, и масштабирует его под кадр. */
    function placeGlow(p: number) {
      if (!stage) return;
      const f = frame(p);
      const l = lampAt(p);
      const gr = l.r * 1600 * f.scale;
      stage.style.setProperty("--gx", `${(f.ox + l.x * 1600 * f.scale).toFixed(1)}px`);
      stage.style.setProperty("--gy", `${(f.oy + l.y * 900 * f.scale).toFixed(1)}px`);
      // базовый радиус градиента 520px (globals.css, .stage__bloom::before)
      stage.style.setProperty("--gs", (gr / 520).toFixed(3));
      // в режиме fit сам ролик ставим туда же — панорама за лампой
      if (fit) {
        stage.style.setProperty("--vw", `${(1600 * f.scale).toFixed(1)}px`);
        stage.style.setProperty("--vh", `${(900 * f.scale).toFixed(1)}px`);
        stage.style.setProperty("--vl", `${f.ox.toFixed(1)}px`);
        stage.style.setProperty("--vt", `${f.oy.toFixed(1)}px`);
      }
    }

    const onScroll = () => {
      if (mode !== "scrub" || queued) return;
      queued = true;
      rafId = requestAnimationFrame(update);
    };

    const pickMode = () => {
      fit = portrait.matches;
      smooth = target;
      stage.dataset.frame = fit ? "fit" : "cover";
      mode = reduced.matches ? "loop" : "scrub";
      if (mode === "loop") applySimple();
      else applyScrub();
      placeGlow(0);
    };

    pickMode();
    placeGlow(0);
    if (hasFrameCallback) {
      frameHandle = frameSource.requestVideoFrameCallback!(onFrame);
    }
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("emptied", onSourceReset);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("timeupdate", onTimeUpdate);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    reduced.addEventListener("change", pickMode);
    portrait.addEventListener("change", pickMode);

    return () => {
      cancelAnimationFrame(rafId);
      if (frameHandle) frameSource.cancelVideoFrameCallback?.(frameHandle);
      cancelAnimationFrame(smoothId);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("emptied", onSourceReset);
      window.removeEventListener("touchstart", primeDecoder);
      window.removeEventListener("pointerdown", primeDecoder);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("timeupdate", onTimeUpdate);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      reduced.removeEventListener("change", pickMode);
      portrait.removeEventListener("change", pickMode);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
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
            <div className="eyebrow hero__eyebrow">
              Услуги в&nbsp;области охраны труда
            </div>
            <h1 className="hero__title">
              Голос
              <br />
              безопасности
              <br />
              нового времени
            </h1>
            <p className="lede">
              Охрана труда как&nbsp;работающая система управления бизнес-рисками.
              Выстраиваем и&nbsp;развиваем системы управления охраной труда и
              производственной безопасностью, интегрируя их в&nbsp;бизнес-процессы и
              помогая снижать производственные и&nbsp;финансовые риски.
            </p>
            <CtaButton className="cta cta--lg">
              Оставить заявку
              <span className="cta__arrow">↗</span>
            </CtaButton>
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
              <div className="stat__label">аудитов в&nbsp;опыте команды</div>
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
              <div className="stat__value">11</div>
              <div className="stat__label">услуг по&nbsp;охране труда</div>
            </div>
          </div>
        </div>

        <svg className="stage__arrows" ref={arrowsRef} aria-hidden="true">
          <defs>
            {LEADERS.map((key, i) => (
              <linearGradient
                key={key}
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
          {LEADERS.map((key, i) => (
            <g data-leader key={key} opacity="0">
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
          <div className="stage__cards-head" data-cards-title>
            <div className="eyebrow">Направления</div>
            <h2 className="section-title">
              Комплексная система безопасности в&nbsp;<span className="stage__cards-accent">трёх плоскостях</span>
            </h2>
          </div>
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

      {/* Телефон: распорка задаёт длину скролл-сцены, затем те же карточки
          отдельным блоком выезжают поверх финального кадра. На десктопе оба
          элемента скрыты. */}
      <div className="stage__spacer" aria-hidden="true" />
      <div className="stage__after">
        <div className="stage__cards-head">
          <div className="eyebrow">Направления</div>
          <h2 className="section-title">
            Комплексная система безопасности в&nbsp;<span className="stage__cards-accent">трёх плоскостях</span>
          </h2>
        </div>
        {CARDS.map((card) => (
          <div className="beacon-card" data-glass="flat" key={`m-${card.n}`}>
            <div className={`beacon-card__art beacon-card__art--${card.art}`} />
            <div className="beacon-card__body">
              <div className="beacon-card__n">{card.n}</div>
              <div className="beacon-card__title">{card.title}</div>
              <div className="beacon-card__text">{card.text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
