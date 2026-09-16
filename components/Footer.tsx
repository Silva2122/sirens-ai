export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <div className="footer__logo">
            SIRENS<span className="logo__dot">.</span>AI
          </div>
          <div className="footer__tagline">Голос безопасности нового времени</div>
        </div>
        <div className="footer__meta">
          <div>IT Safety Solutions · Основано 2025 · Москва</div>
          <div>
            Аудит и документация ОТ · Аутсорсинг ОТ · Диагностика культуры
            безопасности · Внедрение LOTO
          </div>
          <div className="footer__links">
            <a href="#top">sirens.ai</a>
            <a href="mailto:SirensLLC@yandex.ru">SirensLLC@yandex.ru</a>
          </div>
        </div>
      </div>
      <div className="footer__status">
        <span className="footer__dot" />
        Прототип для обсуждения — цены, сроки и контакты требуют финального
        подтверждения
      </div>
    </footer>
  );
}
