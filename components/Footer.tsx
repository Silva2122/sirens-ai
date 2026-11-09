import LegalLink from "@/components/LegalLink";
import { founders } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <div className="footer__logo">
            SIRENS<span className="logo__dot">.</span>
          </div>
          <div className="footer__tagline">Голос безопасности нового времени</div>
        </div>
        <div className="footer__meta">
          <div>Москва</div>
          <div>
            Аудит и&nbsp;документация ОТ · Аутсорсинг ОТ · Диагностика культуры
            безопасности · Внедрение LOTO
          </div>
          {/* Телефоны и почта; Telegram в подвале не показываем — просьба Босса. */}
          <div className="footer__contacts">
            {founders.map((f) => (
              <a href={`tel:${f.tel}`} key={f.tel}>
                {f.phone}
              </a>
            ))}
            <a href="mailto:SirensLLC@yandex.ru">SirensLLC@yandex.ru</a>
          </div>
          {/* Правовые документы открываются в попапе (LegalModal). */}
          <div className="footer__links">
            <LegalLink doc="privacy">Политика обработки персональных данных</LegalLink>
            <LegalLink doc="consent">Согласие на&nbsp;обработку персональных данных</LegalLink>
            <LegalLink doc="mailing">Согласие на&nbsp;получение рассылок</LegalLink>
          </div>
          {/* Реквизиты — ТЗ заказчика по 152-ФЗ от 06.11.2026. */}
          <div className="footer__legal">
            ООО «СИРЕНС» · ИНН 9727132750 · ОГРН 1267700215837 · 117447, г.&nbsp;Москва,
            ул.&nbsp;Дмитрия Ульянова, д.&nbsp;31, помещ.&nbsp;55/4
          </div>
        </div>
      </div>
    </footer>
  );
}
