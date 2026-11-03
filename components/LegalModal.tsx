"use client";

import { useEffect, useState } from "react";
import { legalDoc, type LegalSlug } from "@/lib/legal";

/** Событие, по которому попап с документом открывается из любой ссылки. */
export const LEGAL_EVENT = "sirens:legal";

export function openLegal(slug: LegalSlug) {
  window.dispatchEvent(new CustomEvent(LEGAL_EVENT, { detail: { slug } }));
}

/**
 * Попап с правовым документом (политика, согласия). Монтируется один раз в
 * page.tsx, слушает LEGAL_EVENT; ссылки шлют его через LegalLink. Тексты —
 * в lib/legal.ts. Esc и клик по фону закрывают. Поверх попапа заявки:
 * из формы можно открыть согласие и вернуться к заполнению.
 */
export default function LegalModal() {
  const [slug, setSlug] = useState<LegalSlug | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => setSlug((e as CustomEvent<{ slug: LegalSlug }>).detail.slug);
    window.addEventListener(LEGAL_EVENT, onOpen);
    return () => window.removeEventListener(LEGAL_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!slug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        setSlug(null);
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [slug]);

  if (!slug) return null;
  const doc = legalDoc(slug);

  return (
    <div
      className="bio bio--legal"
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
      onClick={() => setSlug(null)}
    >
      <div className="bio__panel bio__panel--legal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="bio__close"
          aria-label="Закрыть"
          onClick={() => setSlug(null)}
        >
          ✕
        </button>
        <div className="bio__label">Документ</div>
        <h2 className="legal__doc-title">{doc.title}</h2>
        <div className="legal__body" dangerouslySetInnerHTML={{ __html: doc.html }} />
      </div>
    </div>
  );
}
