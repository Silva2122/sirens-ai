"use client";

import type { ComponentProps, MouseEvent } from "react";
import { openLegal } from "@/components/LegalModal";
import type { LegalSlug } from "@/lib/legal";

/**
 * Ссылка на правовой документ: открывает его в попапе. Остаётся обычной
 * ссылкой на /privacy/#<slug> — без JavaScript и при открытии в новой
 * вкладке ведёт на страницу со всеми документами.
 *
 * newTab — открыть документ в новой вкладке (ссылки в подписях чекбоксов
 * формы, по ТЗ 152-ФЗ): заполненная форма остаётся как есть. Ссылка стоит
 * внутри <label>, поэтому клик глушим и открываем вкладку сами — иначе он
 * заодно переключил бы галочку.
 */
export default function LegalLink({
  doc,
  newTab = false,
  onClick,
  children,
  ...rest
}: ComponentProps<"a"> & { doc: LegalSlug; newTab?: boolean }) {
  const href = `/privacy/#${doc}`;
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (newTab) {
      e.preventDefault();
      e.stopPropagation();
      window.open(e.currentTarget.href, "_blank", "noopener");
      return;
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    openLegal(doc);
  };
  return (
    <a
      href={href}
      {...(newTab ? { target: "_blank", rel: "noopener" } : {})}
      {...rest}
      onClick={handle}
    >
      {children}
    </a>
  );
}
