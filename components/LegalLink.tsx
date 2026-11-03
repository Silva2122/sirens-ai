"use client";

import type { ComponentProps, MouseEvent } from "react";
import { openLegal } from "@/components/LegalModal";
import type { LegalSlug } from "@/lib/legal";

/**
 * Ссылка на правовой документ: открывает его в попапе. Остаётся обычной
 * ссылкой на /privacy/#<slug> — без JavaScript и при открытии в новой
 * вкладке ведёт на страницу со всеми документами.
 */
export default function LegalLink({
  doc,
  onClick,
  children,
  ...rest
}: ComponentProps<"a"> & { doc: LegalSlug }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    openLegal(doc);
  };
  return (
    <a href={`/privacy/#${doc}`} {...rest} onClick={handle}>
      {children}
    </a>
  );
}
