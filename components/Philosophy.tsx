"use client";

import { useEffect, useRef } from "react";
import { applyLeader, elbowLeader } from "@/lib/leaders";

type PrincipleArt = "concrete" | "clarity" | "character" | "people";

const PRINCIPLES: {
  n: string;
  title: string;
  text: string;
  place: string;
  art: PrincipleArt;
}[] = [
  { n: "01", title: "Конкретно", text: "Цифры, сроки, результаты", place: "l1", art: "concrete" },
  { n: "02", title: "Без воды", text: "Без «синергий» и общих слов", place: "l2", art: "clarity" },
  {
    n: "03",
    title: "С характером",
    text: "Критикуем статус-кво в охране труда",
    place: "r1",
    art: "character",
  },
  {
    n: "04",
    title: "Про людей",
    text: "Продукт, который спасает жизни",
    place: "r2",
    art: "people",
  },
];

/**
 * Центр свечения и габарит лампы внутри siren-cutout.png, в долях контейнера
 * `.siren`. Сняты с самой картинки: плафон приходится на середину по ширине и
 * на треть высоты — туда же дизайн целил расходящиеся кольца.
 */
const LAMP = { x: 0.496, y: 0.328, a: 0.5, b: 0.45 };

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
        cx: s.left - box.left + LAMP.x * s.width,
        cy: s.top - box.top + LAMP.y * s.height,
        a: LAMP.a * s.width,
        b: LAMP.b * s.height,
      };
      const stub = Math.max(26, s.width * 0.06);

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
          elbowLeader(
            {
              left: r.left - box.left,
              top: r.top - box.top,
              right: r.right - box.left,
              bottom: r.bottom - box.top,
            },
            lamp,
            stub
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
        Мы слышим
        <br />
        риск раньше
      </div>
      <p className="lede">
        Помогаем увидеть и устранить риски до того, как они станут
        происшествиями, штрафами или убытками. Строим культуру безопасности, а не
        отчётность.
      </p>

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
                <div className={`p-card__art p-card__art--${p.art}`} aria-hidden="true" />
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
          <div className="siren__lamp" />
        </div>
      </div>
    </section>
  );
}
