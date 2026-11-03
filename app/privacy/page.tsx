import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_DOCS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных\u00a0— SIRENS",
  description:
    "Политика ООО «СИРЕНС» в\u00a0отношении обработки персональных данных, согласие на\u00a0обработку персональных данных и\u00a0согласие на\u00a0получение рассылок.",
};

/**
 * Все правовые документы одной страницей: на этот адрес ссылаются сами
 * документы (https://sirens-hse.ru/privacy/), а ссылки LegalLink без
 * JavaScript ведут сюда же, к якорю документа. Тексты — lib/legal.ts.
 */
export default function PrivacyPage() {
  return (
    <main className="legal">
      <Link href="/" className="legal__back">
        ← На&nbsp;главную
      </Link>
      <div className="eyebrow">Правовая информация</div>
      {LEGAL_DOCS.map((d, i) => (
        <section key={d.slug} id={d.slug} className="legal__doc">
          {i === 0 ? (
            <h1 className="legal__title">{d.title}</h1>
          ) : (
            <h2 className="legal__title legal__title--sub">{d.title}</h2>
          )}
          <div className="legal__body" dangerouslySetInnerHTML={{ __html: d.html }} />
        </section>
      ))}
    </main>
  );
}
