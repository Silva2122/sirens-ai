"use client";

import type { ComponentProps, MouseEvent } from "react";
import { openLead } from "@/components/LeadModal";

/**
 * Кнопка «Оставить заявку»: открывает попап с формой. Остаётся ссылкой на
 * #contacts — без JavaScript ведёт к форме в подвале.
 */
export default function CtaButton({
  onClick,
  children,
  service,
  note,
  ...rest
}: ComponentProps<"a"> & { service?: string; note?: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    openLead({ service, note });
  };
  return (
    <a href="#contacts" {...rest} onClick={handle}>
      {children}
    </a>
  );
}
