import { dims } from "@/lib/assessment";
import { typo } from "@/lib/typo";

/** Подсчёт результата после последнего ответа: точка в кольцах сирены,
 *  буквы SIRENS загораются по очереди, строки появляются одна за другой. */
export function CalcScreen({ questions }: { questions: number }) {
  const lines = [
    `Считаем баллы по ${questions} ${questions % 10 === 1 && questions % 100 !== 11 ? "вопросу" : "вопросам"}`,
    `Строим профиль по ${dims.length} направлениям`,
    "Проверяем обязательные требования",
    "Собираем план на\u00a090\u00a0дней",
  ];
  return (
    <div className="calc" role="status" aria-live="polite">
      <div className="beacon" aria-hidden="true">
        <span className="beacon__ring" />
        <span className="beacon__ring" />
        <span className="beacon__ring" />
        <span className="beacon__glow" />
        <span className="beacon__dot" />
      </div>
      <h2 className="calc__title">Считаем результат</h2>
      <ol className="calc__letters" aria-hidden="true">
        {dims.map((d, i) => (
          <li key={d.id} className="calc__letter" style={{ ["--i" as string]: i }}>
            {d.letter}
          </li>
        ))}
      </ol>
      <ul className="calc__lines">
        {lines.map((l, i) => (
          <li key={l} className="calc__line" style={{ ["--i" as string]: i }}>
            {typo(l)}
          </li>
        ))}
      </ul>
    </div>
  );
}
