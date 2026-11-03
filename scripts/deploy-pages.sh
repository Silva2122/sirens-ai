#!/usr/bin/env bash
# Выкладка сайта на GitHub Pages: https://silva2122.github.io/sirens-ai/
#
# Pages отдаёт сайт из подпапки /sirens-ai, поэтому:
#  1) собираем статический экспорт с basePath;
#  2) дописываем префикс к абсолютным ссылкам на /assets/ — Next сам правит
#     только свои пути в /_next/, а наши картинки, видео и url() в CSS нет;
#  3) кладём .nojekyll, иначе Pages прячет папку _next;
#  4) публикуем содержимое out/ в ветку gh-pages.
set -euo pipefail

REPO=https://github.com/Silva2122/sirens-ai.git
BASE=/sirens-ai
cd "$(dirname "$0")/.."

echo "→ сборка"
rm -rf .next out
PAGES_BASE_PATH="$BASE" npm run build

echo "→ префикс для ссылок на ассеты"
python3 - "$BASE" <<'PY'
import os, re, sys
base = sys.argv[1]
for root, _, files in os.walk("out"):
    for f in files:
        if not f.endswith((".html", ".css", ".js", ".txt", ".json")):
            continue
        p = os.path.join(root, f)
        try:
            s = open(p, encoding="utf-8").read()
        except UnicodeDecodeError:
            continue
        new = re.sub(r'(?<!' + re.escape(base) + r')/assets/', base + '/assets/', s)
        if new != s:
            open(p, "w", encoding="utf-8").write(new)
PY
touch out/.nojekyll

echo "→ публикация в gh-pages"
cd out
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Сборка сайта SIRENS.AI для GitHub Pages"
git push -q -f "$REPO" gh-pages
echo "готово: https://silva2122.github.io/sirens-ai/"
