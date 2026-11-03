#!/usr/bin/env node
// Типографика русских текстов сайта: неразрывные пробелы там, где строка
// не должна рваться. Проходит по JSX-тексту и строковым литералам в
// components/, lib/content.ts и app/**/page.tsx. Идемпотентен — можно
// гонять после каждой правки текстов: `npm run typo`.
//
// Правила:
//  - после коротких предлогов, союзов и частиц (в, и, на, с, к, не, для…);
//    регистр учитывается, чтобы «ОТ» (охрана труда) не считалось предлогом «от»;
//  - перед тире «—», чтобы оно не начинало строку;
//  - между разрядами чисел (35 000), перед ₽, между числом и словом (6 лет)
//    и внутри телефона (+7 (916) 000-69-98);
//  - после сокращений (г., ул., м., им.) и инициалов (И. М. Губкина);
//  - составные предлоги «из-за», «из-под» не рвутся по дефису (word joiner).
//
// В JSX-тексте и атрибутах ставится &nbsp;, в строках кода — \u00a0: и то
// и другое видно в исходнике, в отличие от «голого» неразрывного пробела.
// Комментарии не трогаем.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const NBSP = "\u00a0";
/** Word joiner: запрещает перенос в точке вставки, ширины не имеет. */
const WJ = "\u2060";
const GLUED = ["из-за", "из-под", "по-прежнему"];
const SHORT = [
  "в", "во", "и", "а", "но", "на", "с", "со", "к", "ко", "о", "об", "обо", "у",
  "по", "за", "от", "до", "не", "ни", "из", "для", "при", "под", "над", "без",
  "про", "или", "что", "как", "же", "ли", "бы", "то", "чем",
];
const ABBR = ["г", "ул", "м", "им", "д", "стр", "корп", "тел"];
const CYR = "А-ЯЁа-яё";
const cap = (w) => w[0].toUpperCase() + w.slice(1);
const SHORT_ALT = SHORT.flatMap((w) => [w, cap(w)]).join("|");

/** Применяет правила к куску текста; NBSP внутри — настоящий символ. */
function typo(text) {
  let t = text;
  // разряды чисел и знак рубля: 35 000 ₽ → 35 000 ₽
  t = t.replace(/(\d) (\d{3})(?!\d)/g, `$1${NBSP}$2`);
  t = t.replace(/(\d) ₽/g, `$1${NBSP}₽`);
  // телефон целиком: +7 (916) 000-69-98
  t = t.replace(/\+7 \((\d{3})\) (?=\d)/g, `+7${NBSP}($1)${NBSP}`);
  // число не отрывается от слова: 6 лет, 20 предприятий
  t = t.replace(new RegExp(`(\\d+\\+?) (?=[${CYR}])`, "g"), `$1${NBSP}`);
  // сокращения и инициалы: ул. Дмитрия, И. М. Губкина (\b кириллицу не знает)
  // дважды: соседние совпадения («И. М. Губкина») перекрываются пробелом
  for (let i = 0; i < 2; i += 1) {
    t = t.replace(
      new RegExp(`(^|[^${CYR}\\w])(${ABBR.join("|")})\\. (?=[${CYR}])`, "g"),
      `$1$2.${NBSP}`
    );
    t = t.replace(new RegExp(`(^|[^${CYR}\\w])([А-ЯЁ])\\. (?=[${CYR}])`, "g"), `$1$2.${NBSP}`);
  }
  // тире не начинает строку
  t = t.replace(/ —/g, `${NBSP}—`);
  // составные предлоги не рвутся по дефису
  for (const w of GLUED) {
    const glued = w.replace("-", `${WJ}-${WJ}`);
    t = t.replace(new RegExp(`(^|[^${CYR}])${w}(?=[^${CYR}]|$)`, "gi"), (m, pre) => {
      const src = m.slice(pre.length);
      return pre + (src[0] === src[0].toUpperCase() ? cap(glued) : glued);
    });
  }
  // короткие слова не заканчивают строку; повторяем, чтобы цепочки
  // «или не в» связались целиком
  const short = new RegExp(
    // конец куска = начало инлайн-тега (<span>, <Link>): предлог перед ним тоже держим
    `(^|[\\s(«"])(${SHORT_ALT}) (?=[${CYR}\\d«(A-Za-z]|$)`,
    "g"
  );
  for (let i = 0; i < 3; i += 1) t = t.replace(short, `$1$2${NBSP}`);
  return t;
}

const hasCyr = (s) => /[А-Яа-яЁё]/.test(s);
const looksLikeComment = (s) => /\/\/|\/\*|\*\/|^\s*\*/m.test(s);

/** Приводит все формы NBSP к обычному пробелу — чтобы прогон был идемпотентным. */
const normalize = (s) =>
  s.replace(/&nbsp;|\\u00a0|\u00a0/g, " ").replace(/&#8288;|\\u2060|\u2060/g, "");

/** JSX-текст: куски между > и <, без выражений в фигурных скобках и комментариев. */
function processJsxText(src) {
  return src.replace(/>([^<>]*)</g, (m, inner) => {
    if (!hasCyr(inner) || looksLikeComment(inner)) return m;
    const out = inner
      .split(/(\{[^}]*\})/)
      .map((part) =>
        part.startsWith("{")
          ? part
          : typo(part).replaceAll(NBSP, "&nbsp;").replaceAll(WJ, "&#8288;")
      )
      .join("");
    return `>${out}<`;
  });
}

/** Строковые литералы в двойных кавычках с кириллицей, кроме комментариев. */
function processStrings(src) {
  return src
    .split("\n")
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
        return line;
      }
      return line.replace(/"((?:[^"\\]|\\.)*)"/g, (m, inner, offset) => {
        // телефоны без кириллицы, но им тоже нужны неразрывные пробелы
        if (!hasCyr(inner) && !/\+7 \(/.test(inner)) return m;
        // в JSX-атрибуте (placeholder="…") escape \u00a0 не работает — там &nbsp;
        const isAttr = line[offset - 1] === "=";
        return `"${typo(inner)
          .replaceAll(NBSP, isAttr ? "&nbsp;" : "\\u00a0")
          .replaceAll(WJ, isAttr ? "&#8288;" : "\\u2060")}"`;
      });
    })
    .join("\n");
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name) && !name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

const files = [
  ...walk("components"),
  "lib/content.ts",
  ...walk("app").filter((f) => f.endsWith("page.tsx")),
];

let changed = 0;
for (const f of files) {
  const before = readFileSync(f, "utf8");
  let after = processStrings(normalize(before));
  if (f.endsWith(".tsx")) after = processJsxText(after);
  if (after !== before) {
    writeFileSync(f, after);
    changed += 1;
    console.log("→", f);
  }
}
console.log(changed ? `обновлено файлов: ${changed}` : "всё уже типографлено");
