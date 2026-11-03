"use client";

import type { ComponentProps, MouseEvent } from "react";
import type { ServiceSlug } from "@/lib/content";

/** Событие «раскрой услугу»: его слушает Services, шлют карточки «Почему». */
export const SERVICE_EVENT = "sirens:service";

export function openService(slug: ServiceSlug) {
  window.dispatchEvent(new CustomEvent(SERVICE_EVENT, { detail: { slug } }));
}

/**
 * Ссылка на конкретную услугу: по клику Services раскрывает нужную группу и
 * строку и подводит к ней экран. Без JavaScript остаётся якорем
 * #service-<slug> — ведёт хотя бы к разделу «Услуги».
 */
export default function ServiceLink({
  service,
  onClick,
  children,
  ...rest
}: ComponentProps<"a"> & { service: ServiceSlug }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    openService(service);
  };
  return (
    <a href={`#service-${service}`} {...rest} onClick={handle}>
      {children}
    </a>
  );
}
