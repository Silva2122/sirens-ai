import { levelIndexFor, levels } from "@/lib/assessment";

/**
 * Итог: оценка из 100, уровень и шкала из пяти уровней SIRENS с отметкой.
 * Один вид для квиза, полного теста и дашборда. level передают, когда он
 * ограничен несоответствиями и не совпадает с уровнем по оценке. bare — без
 * строки с оценкой, когда она уже крупно показана рядом (квиз).
 */
export default function LevelMeter({
  T,
  level = levelIndexFor(T),
  compact = false,
  bare = false,
}: {
  T: number;
  level?: number;
  compact?: boolean;
  bare?: boolean;
}) {
  return (
    <div className={`meter${compact ? " meter--compact" : ""}`}>
      {!bare && (
        <div className="meter__head">
          <span className="meter__score">
            {T}
            <span className="meter__of"> / 100</span>
          </span>
          <span className="meter__level">{levels[level].name}</span>
        </div>
      )}
      <div className="meter__scale" style={{ ["--share" as string]: T / 100 }}>
        {levels.map((l, i) => (
          <span
            key={l.name}
            className="meter__zone"
            data-active={i === level ? "1" : "0"}
            style={{ ["--span" as string]: l.range[1] - l.range[0] + 1 }}
          >
            <span className="meter__zone-name">{l.name}</span>
          </span>
        ))}
        <span className="meter__mark" aria-hidden="true" />
      </div>
      {!compact && <p className="meter__text">{levels[level].portrait}</p>}
    </div>
  );
}
