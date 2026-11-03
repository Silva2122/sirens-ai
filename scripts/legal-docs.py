#!/usr/bin/env python3
"""
Собирает lib/legal.ts из правовых документов заказчика (docs/source/legal/*.docx).

docx → HTML через macOS textutil, дальше чистим разметку до семантики:
заголовки разделов (I., II., …) → <h3>, абзацы, списки с «—» → <ul>,
таблицы → <table> с шапкой. Название документа выводит сам попап, поэтому
титульные строки docx («СОГЛАСИЕ», «на обработку…», адрес сайта) пропускаем.
Почта и адреса сайта становятся ссылками, после коротких слов — неразрывный
пробел, как во всём сайте.

Запуск после правки документов: python3 scripts/legal-docs.py
"""
import html as H
import re
import subprocess
import tempfile
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs/source/legal"
OUT = ROOT / "lib/legal.ts"

DOCS = [
    ("privacy", "policy.docx", "Политика обработки персональных данных", 4),
    ("consent", "consent.docx", "Согласие на обработку персональных данных", 3),
    ("mailing", "mailing.docx", "Согласие на получение рассылок", 3),
]

NBSP = " "
SHORT = r"(?:в|во|и|с|со|к|ко|о|об|у|а|на|по|от|до|за|из|не|ни|для|при|без|или|что|как|но|же|№|ст\.|ч\.|п\.|г\.|д\.|т\.)"


class Blocks(HTMLParser):
    """Достаёт из HTML textutil последовательность абзацев и таблиц."""

    def __init__(self):
        super().__init__()
        self.blocks = []  # ("p", text, bold_prefix) | ("table", rows)
        self.cur = None
        self.bold = False
        self.bold_text = ""
        self.table = None
        self.row = None
        self.cell = None

    def handle_starttag(self, tag, attrs):
        if tag == "p":
            self.cur = ""
            self.bold_text = ""
        elif tag == "b":
            self.bold = True
        elif tag == "table":
            self.table = []
        elif tag == "tr" and self.table is not None:
            self.row = []
        elif tag == "td" and self.row is not None:
            self.cell = []

    def handle_endtag(self, tag):
        if tag == "b":
            self.bold = False
        elif tag == "p" and self.cur is not None:
            text = re.sub(r"\s+", " ", self.cur).strip()
            if self.cell is not None:
                if text:
                    self.cell.append(text)
            elif text:
                self.blocks.append(("p", text, self.bold_text.strip()))
            self.cur = None
        elif tag == "td" and self.cell is not None:
            self.row.append(" ".join(self.cell))
            self.cell = None
        elif tag == "tr" and self.row is not None:
            self.table.append(self.row)
            self.row = None
        elif tag == "table" and self.table is not None:
            self.blocks.append(("table", self.table))
            self.table = None

    def handle_data(self, data):
        if self.cur is not None:
            self.cur += data
            if self.bold:
                self.bold_text += data


def typo(s: str) -> str:
    s = re.sub(rf"(^|[\s(«]){SHORT} ", lambda m: m.group(0)[:-1] + NBSP, s, flags=re.I)
    s = re.sub(rf"(^|[\s(«]){SHORT} ", lambda m: m.group(0)[:-1] + NBSP, s, flags=re.I)
    s = re.sub(r"(\d) (\d{3})(?!\d)", rf"\1{NBSP}\2", s)
    s = re.sub(r" — ", f"{NBSP}— ", s)
    return s


def inline(text: str) -> str:
    t = H.escape(typo(text), quote=False)
    t = re.sub(
        r"[\w.+-]+@[\w-]+\.[\w.]+",
        lambda m: f'<a href="mailto:{m.group(0)}">{m.group(0)}</a>',
        t,
    )
    t = re.sub(r"https://sirens-hse\.ru/privacy/", '<a href="/privacy/">https://sirens-hse.ru/privacy/</a>', t)
    return t


def convert(slug, path, skip):
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "doc.html"
        subprocess.run(["textutil", "-convert", "html", "-output", str(out), str(path)], check=True)
        src = out.read_text(encoding="utf-8")
    p = Blocks()
    p.feed(src)
    blocks = p.blocks
    # титульные строки: у политики — первая строка «УТВЕРЖДЕНА…» идёт мета-строкой
    meta = []
    if slug == "privacy":
        meta.append(blocks[0][1])
        blocks = blocks[skip:]
    else:
        blocks = blocks[skip:]

    html, ul = [], []

    def flush():
        if ul:
            html.append("<ul>" + "".join(f"<li>{x}</li>" for x in ul) + "</ul>")
            ul.clear()

    for b in blocks:
        if b[0] == "table":
            flush()
            rows = b[1]
            head = "".join(f"<th>{inline(c)}</th>" for c in rows[0])
            body = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows[1:])
            html.append(f'<div class="legal__table"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>')
            continue
        _, text, bold = b
        if text.startswith("—"):
            ul.append(inline(text.lstrip("— ").strip()))
            continue
        flush()
        if re.match(r"^[IVX]+\.\s", text) and bold == text:
            html.append(f"<h3>{inline(text)}</h3>")
        elif text.startswith("Редакция от") or text.startswith("9.5. Редакция"):
            html.append(f'<p class="legal__meta">{inline(text)}</p>')
        elif bold and text.startswith(bold) and re.match(r"^\d+(\.\d+)*\.", bold):
            html.append(f"<p><b>{inline(bold)}</b>{inline(text[len(bold):])}</p>")
        else:
            html.append(f"<p>{inline(text)}</p>")
    flush()
    if meta:
        html.insert(0, f'<p class="legal__meta">{inline(meta[0])}</p>')
    return "".join(html)


parts = []
for slug, file, title, skip in DOCS:
    body = convert(slug, SRC / file, skip)
    # заголовки разделов из docx — капсом; приводим к обычному регистру
    body = re.sub(
        r"<h3>([IVX]+)\.\s([^<]+)</h3>",
        lambda m: f"<h3>{m.group(1)}. {m.group(2)[0]}{m.group(2)[1:].lower()}</h3>",
        body,
    )
    body = body.replace("Cookie", "Cookie").replace("«сиренс»", "«СИРЕНС»")
    parts.append(
        "  {\n"
        f'    slug: "{slug}",\n'
        f"    title: {title!r},\n".replace("'", '"')
        + f"    html: {repr(body)},\n".replace("\\xa0", "\\u00a0")
        + "  },\n"
    )

OUT.write_text(
    "/**\n"
    " * Правовые документы сайта — сгенерировано scripts/legal-docs.py из\n"
    " * docs/source/legal/*.docx (редакция заказчика от 12.10.2026). Руками не править:\n"
    " * поменять docx и перезапустить скрипт.\n"
    " */\n\n"
    'export type LegalSlug = "privacy" | "consent" | "mailing";\n\n'
    "export type LegalDoc = { slug: LegalSlug; title: string; html: string };\n\n"
    "export const LEGAL_DOCS: LegalDoc[] = [\n" + "".join(parts) + "];\n\n"
    "export const legalDoc = (slug: LegalSlug) =>\n"
    "  LEGAL_DOCS.find((d) => d.slug === slug) as LegalDoc;\n",
    encoding="utf-8",
)
print("→", OUT.relative_to(ROOT))
