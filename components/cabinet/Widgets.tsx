import Link from "next/link";
import CabIcon, { type CabIconName } from "@/components/cabinet/CabIcons";
import { dims } from "@/lib/assessment";
import { typo } from "@/lib/typo";

/**
 * Общие виджеты дашборда и опросника: карточка-показатель и шесть
 * направлений SIRENS таблетками.
 */

export function Stat({
  label,
  value,
  unit,
  foot,
  href,
  alarm = false,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  foot: string;
  /** без ссылки карточка не кликается и стрелки у неё нет */
  href?: string;
  alarm?: boolean;
  /** под значением — например, полоса прогресса */
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <span className="stat__top">
        <span className="stat__label">{label}</span>
        {href && (
          <span className="stat__arrow">
            <CabIcon name="arrow" />
          </span>
        )}
      </span>
      <span className="stat__value">
        {value}
        {unit && <span className="stat__unit"> {unit}</span>}
      </span>
      {children}
      <span className="stat__foot">{typo(foot)}</span>
    </>
  );
  const attrs = {
    className: "stat",
    "data-alarm": alarm ? "1" : "0",
  };
  return href ? (
    <Link href={href} {...attrs}>
      {body}
    </Link>
  ) : (
    <div {...attrs} data-static="1">
      {body}
    </div>
  );
}

/**
 * Шесть направлений таблетками: заливка снизу — доля 0–100, штриховка —
 * остаток. accent — ярко-красная таблетка, soft — тёплая; onPick делает
 * таблетки кнопками.
 */
export function Pills({
  values,
  labels,
  accent = null,
  soft = null,
  empty,
  onPick,
  locked,
}: {
  values: number[] | null;
  labels?: string[];
  accent?: number | null;
  soft?: number | null;
  /** подпись поверх пустых таблеток */
  empty?: string;
  onPick?: (i: number) => void;
  locked?: (i: number) => boolean;
}) {
  return (
    <div className="pills" data-empty={values ? "0" : "1"}>
      {dims.map((d, i) => {
        const v = values?.[i] ?? 0;
        const inner = (
          <>
            <span className="pills__value">{labels?.[i] ?? ""}</span>
            <span className="pills__track">
              {v > 0 && <span className="pills__fill" style={{ ["--share" as string]: v / 100 }} />}
            </span>
            <span className="pills__letter">{d.letter}</span>
          </>
        );
        const attrs = {
          className: "pills__col",
          "data-accent": i === accent ? "1" : "0",
          "data-soft": i === soft ? "1" : "0",
          title: d.name,
          style: { ["--i" as string]: i },
        };
        return onPick ? (
          <button key={d.id} type="button" {...attrs} disabled={locked?.(i)} onClick={() => onPick(i)}>
            {inner}
          </button>
        ) : (
          <div key={d.id} {...attrs}>
            {inner}
          </div>
        );
      })}
      {!values && empty && <p className="pills__empty">{empty}</p>}
    </div>
  );
}

/** Заголовок карточки со значком в квадратике — одинаковый во всём кабинете. */
export function TileTitle({ icon, children }: { icon: CabIconName; children: React.ReactNode }) {
  return (
    <h2 className="tile__title">
      <span className="tile__icon">
        <CabIcon name={icon} />
      </span>
      {children}
    </h2>
  );
}
