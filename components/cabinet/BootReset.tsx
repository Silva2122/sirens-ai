"use client";

import { useEffect } from "react";

/**
 * Ранний скрипт из app/layout.tsx рассчитан на лендинг: ставит is-preloading
 * (запирает скролл до ухода прелоадера) и reveal-ready. В кабинете прелоадера
 * нет — снимаем классы сразу, не дожидаясь аварийного таймера в 6 секунд.
 */
export default function BootReset() {
  useEffect(() => {
    (window as Window & { __sirensBoot?: boolean }).__sirensBoot = true;
    const html = document.documentElement;
    html.classList.remove("is-preloading", "reveal-ready");
    html.classList.add("is-loaded");
  }, []);
  return null;
}
