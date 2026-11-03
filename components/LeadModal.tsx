"use client";

import { useEffect, useState } from "react";
import LeadForm from "@/components/LeadForm";

/** Событие, по которому попап открывается из любой кнопки на странице. */
export const LEAD_EVENT = "sirens:lead";

export type LeadDetail = {
  service?: string;
  /** пояснение над формой — например, что онлайн-инструмент ещё в разработке */
  note?: string;
};

export function openLead(detail: LeadDetail = {}) {
  window.dispatchEvent(new CustomEvent(LEAD_EVENT, { detail }));
}

/**
 * Попап с формой заявки — та же форма, что в подвале. Монтируется один раз
 * в page.tsx и слушает LEAD_EVENT; кнопки шлют его через CtaButton.
 * Esc и клик по фону закрывают, страница под окном не прокручивается.
 */
export default function LeadModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<LeadDetail>({});

  useEffect(() => {
    const onOpen = (e: Event) => {
      setDetail((e as CustomEvent<LeadDetail>).detail ?? {});
      setOpen(true);
    };
    window.addEventListener(LEAD_EVENT, onOpen);
    return () => window.removeEventListener(LEAD_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="bio bio--lead"
      role="dialog"
      aria-modal="true"
      aria-label="Заявка"
      onClick={() => setOpen(false)}
    >
      <div className="bio__panel bio__panel--lead" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="bio__close"
          aria-label="Закрыть"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        <LeadForm autoFocus service={detail.service} note={detail.note} />
      </div>
    </div>
  );
}
