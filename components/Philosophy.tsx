"use client";

import { useEffect, useRef } from "react";
import SirenIcon from "@/components/SirenIcon";
import { applyLeader, silhouetteLeader } from "@/lib/leaders";

/**
 * Философия 3S: две карточки слева (Signal, System), одна справа (Safety) —
 * так попросил заказчик 08.10.2026, карточка «Про людей» убрана. Выноски
 * идут от каждой карточки к лампе (lib/leaders.ts).
 */
const PRINCIPLES: {
  n: string;
  title: string;
  text: string;
  place: string;
  /** номер сирены в SirenIcon (10–12 — серия «Философии») */
  icon: number;
}[] = [
  {
    n: "01",
    title: "S — Signal",
    text: "Видим ранние сигналы риска",
    place: "lt",
    icon: 10,
  },
  {
    n: "02",
    title: "S — System",
    text: "Превращаем отдельные меры в\u00a0систему",
    place: "lb",
    icon: 11,
  },
  {
    n: "03",
    title: "S — Safety",
    text: "Делаем безопасность частью бизнеса",
    place: "right",
    icon: 12,
  },
];

/**
 * Силуэт лампы из siren-cutout.png в долях контейнера `.siren` (его ширина —
 * ширина корпуса, картинка шире на свечение и центрирована: см. .siren__lamp).
 * Строки: доля высоты, левый и правый край. Снято по альфа-каналу; между
 * строками интерполируем. Выноски упираются точно в этот контур.
 */
const SILHOUETTE: [number, number, number][] = [
  [0.024, 0.44, 0.56],
  [0.049, 0.277, 0.723],
  [0.073, 0.195, 0.805],
  [0.098, 0.136, 0.859],
  [0.122, 0.109, 0.886],
  [0.147, 0.087, 0.907],
  [0.171, 0.075, 0.918],
  [0.22, 0.066, 0.929],
  [0.269, 0.059, 0.934],
  [0.318, 0.048, 0.941],
  [0.367, 0.043, 0.945],
  [0.416, 0.039, 0.952],
  [0.464, 0.032, 0.957],
  [0.513, 0.027, 0.961],
  [0.538, 0.016, 0.973],
  [0.562, 0.0, 0.989],
  [0.831, 0.0, 0.989],
  [0.855, 0.027, 0.961],
  [0.88, 0.059, 0.934],
  [0.904, 0.109, 0.886],
];

const edge = (yFrac: number, side: -1 | 1) => {
  let i = 1;
  while (i < SILHOUETTE.length - 1 && SILHOUETTE[i][0] < yFrac) i += 1;
  const [y0, l0, r0] = SILHOUETTE[i - 1];
  const [y1, l1, r1] = SILHOUETTE[i];
  const k = Math.min(1, Math.max(0, (yFrac - y0) / (y1 - y0)));
  return side < 0 ? l0 + (l1 - l0) * k : r0 + (r1 - r0) * k;
};

export default function Philosophy() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sirenRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const siren = sirenRef.current;
    const svg = svgRef.current;
    if (!stage || !siren || !svg) return;

    const draw = () => {
      const box = stage.getBoundingClientRect();
      if (!box.width) return;
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);

      const s = siren.getBoundingClientRect();
      const lamp = {
        left: s.left - box.left,
        top: s.top - box.top,
        width: s.width,
        height: s.height,
      };
      const stub = Math.max(26, s.width * 0.06);
      const diag = Math.max(40, s.width * 0.1);

      const groups = svg.querySelectorAll<SVGGElement>("[data-leader]");
      const grads = svg.querySelectorAll("[data-leader-grad]");
      const cards = stage.querySelectorAll<HTMLElement>("[data-card]");

      cards.forEach((card, i) => {
        const g = groups[i];
        if (!g) return;
        const r = card.getBoundingClientRect();
        applyLeader(
          g,
          grads[i],
          silhouetteLeader(
            {
              left: r.left - box.left,
              top: r.top - box.top,
              right: r.right - box.left,
              bottom: r.bottom - box.top,
            },
            lamp,
            edge,
            stub,
            diag
          )
        );
      });
    };

    draw();
    document.fonts?.ready.then(draw).catch(() => {});

    const ro = new ResizeObserver(draw);
    ro.observe(stage);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            stage.dataset.revealed = "1";
            draw();
            io.disconnect();
          }
        }
      },
      { rootMargin: "-15% 0px" }
    );
    io.observe(stage);

    window.addEventListener("resize", draw, { passive: true });
    return () => {
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, []);

  return (
    <section className="philosophy">
      <div className="philosophy__glow" />
      <div className="eyebrow">Философия</div>
      <div className="philosophy__title">
        Мы «слышим»
        <br />
        риск раньше
      </div>
      <p className="lede">
        Помогаем увидеть и&nbsp;устранить риски до&nbsp;того, как&nbsp;они станут
        происшествиями, штрафами или&nbsp;убытками.
      </p>
      <div className="philosophy__subhead">Философия 3S</div>

      <div className="philosophy__stage" ref={stageRef}>
        <svg className="philosophy__leaders" ref={svgRef} aria-hidden="true">
          <defs>
            {PRINCIPLES.map((p, i) => (
              <linearGradient
                key={p.n}
                id={`plead-${i}`}
                data-leader-grad
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="55%" stopColor="rgba(255,255,255,0.45)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.75)" />
              </linearGradient>
            ))}
          </defs>
          {PRINCIPLES.map((p, i) => (
            <g data-leader key={p.n} style={{ ["--d" as string]: `${i * 0.09}s` }}>
              <path
                data-leader-line
                className="lead__line"
                stroke={`url(#plead-${i})`}
              />
              <circle data-leader-dot className="lead__dot" r="4" />
            </g>
          ))}
        </svg>

        <div className="philosophy__cards">
          {PRINCIPLES.map((p, i) => (
            <div
              key={p.n}
              className={`beacon-card beacon-card--plain p-card--${p.place}`}
              data-card
              data-glass="flat"
              style={{ ["--d" as string]: `${i * 0.09}s` }}
            >
              <div className="beacon-card__body">
                <div className="p-card__icon">
                  <SirenIcon variant={p.icon} />
                </div>
                <div className="beacon-card__title">{p.title}</div>
                <div className="beacon-card__text">{p.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="siren" ref={sirenRef}>
          <div className="siren__ring siren__ring--1" />
          <div className="siren__ring siren__ring--2" />
          <div className="siren__ring siren__ring--3" />
          {/* <img>, а не background: drop-shadow у фона считается по боксу
              и на свечении читался чёрным прямоугольником. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="siren__lamp" src="/assets/siren-cutout.png" alt="" />
        </div>
      </div>
    </section>
  );
}
