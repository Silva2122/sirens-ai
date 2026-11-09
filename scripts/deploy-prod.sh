#!/usr/bin/env bash
# Выкладка боевого сайта https://sirens-hse.ru на хостинг reg.ru.
#
# Сборка без basePath и без NEXT_PUBLIC_DEMO: кабинета и квиза нет, Метрика
# есть (lib/features.ts). Страницы /cabinet/ Next всё равно экспортирует — удаляем
# их из out/ перед выкладкой. rsync с --delete убирает старые чанки _next.
# Доступ по SSH — у Босса; пароль спросит ssh, в репозиторий не кладём.
set -euo pipefail

HOST=u3674087@server204.hosting.reg.ru
DEST=www/sirens-hse.ru/
cd "$(dirname "$0")/.."

echo "→ сборка"
rm -rf .next out
env -u NEXT_PUBLIC_DEMO -u PAGES_BASE_PATH npm run build

rm -rf out/cabinet
if grep -rl --include=*.html -e 'href="/cabinet' out >/dev/null; then
  echo "в сборке остался кабинет — стоп" >&2
  exit 1
fi

echo "→ выкладка на $HOST:$DEST"
rsync -rlvz --delete ${DRY_RUN:+--dry-run} out/ "$HOST:$DEST"
echo "готово: https://sirens-hse.ru/"
