/**
 * Типографика текстов, которые приходят данными (спецификация опросника),
 * а не лежат в коде: их не видит scripts/typograf.mjs. Правила те же —
 * неразрывный пробел после коротких предлогов, союзов и частиц, перед
 * тире и между числом и словом, — меняются только пробелы, не слова.
 */

const NBSP = " ";
const CYR = "А-ЯЁа-яё";
const SHORT = [
  "в", "во", "и", "а", "но", "на", "с", "со", "к", "ко", "о", "об", "обо", "у",
  "по", "за", "от", "до", "не", "ни", "из", "для", "при", "под", "над", "без",
  "про", "или", "что", "как", "же", "ли", "бы", "то", "чем",
];
const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
const SHORT_RE = new RegExp(
  `(^|[\\s(«"])(${SHORT.flatMap((w) => [w, cap(w)]).join("|")}) (?=[${CYR}\\d«(A-Za-z]|$)`,
  "g"
);

export function typo(text: string): string {
  let t = text
    .replace(/(\d) (\d{3})(?!\d)/g, `$1${NBSP}$2`)
    .replace(new RegExp(`(\\d+%?\\+?) (?=[${CYR}])`, "g"), `$1${NBSP}`)
    .replace(/ —/g, `${NBSP}—`);
  // повторяем, чтобы цепочки «или не в» связались целиком
  for (let i = 0; i < 3; i += 1) t = t.replace(SHORT_RE, `$1$2${NBSP}`);
  return t;
}

/** Применяет typo ко всем строкам вложенного объекта; ключи не трогает. */
export function typoDeep<T>(value: T): T {
  if (typeof value === "string") return typo(value) as T;
  if (Array.isArray(value)) return value.map(typoDeep) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, typoDeep(v)])) as T;
  }
  return value;
}
