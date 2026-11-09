"use client";

import LegalLink from "@/components/LegalLink";
import { useEffect, useRef, useState } from "react";

/**
 * Форма заявки. Одна и та же в подвале («Контакты») и в попапе по кнопкам
 * «Оставить заявку» — правится в одном месте. Отправка — public/api/lead.php.
 */
/**
 * Маска телефона «+7 (999) 123-45-67». Берём только цифры; если первая —
 * 7 или 8, это код страны, иначе номер начат с кода оператора («996…») и
 * «+7» подставляем сами. Больше десяти цифр после кода не берём.
 */
export function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits[0] === "7" || digits[0] === "8") digits = digits.slice(1);
  digits = digits.slice(0, 10);
  const [a, b, c, d] = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)];
  let out = "+7";
  if (a) out += ` (${a}`;
  if (a.length === 3) out += ")";
  if (b) out += ` ${b}`;
  if (c) out += `-${c}`;
  if (d) out += `-${d}`;
  return out;
}

/**
 * Поле телефона с маской: значение и обработчик для <input type="tel">.
 * Общее для заявки, квиза и регистрации в кабинете.
 */
export function usePhoneField(initial = "") {
  const [phone, setPhone] = useState(initial);

  const onPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const deleting = (e.nativeEvent as InputEvent).inputType?.startsWith("delete");
    let next = formatPhone(e.target.value);
    // Backspace снял только скобку или дефис — маска вернула бы их обратно,
    // и поле бы «залипло». Считаем, что хотели стереть цифру перед ними.
    if (deleting && next === phone) {
      next = formatPhone(e.target.value.replace(/\d(?!.*\d)/, ""));
    }
    // Стёрли всё до голого «+7» — очищаем поле целиком, иначе из маски
    // не выбраться: код страны подставлялся бы снова и снова.
    setPhone(deleting && next === "+7" ? "" : next);
  };

  return { value: phone, onChange: onPhone };
}

/** Куда уходит заявка: PHP-обработчик на хостинге, см. public/api/lead.php. */
const LEAD_ENDPOINT = "/api/lead.php";
/** Тестовая сборка для заказчика (scripts/deploy-test.sh): PHP там нет,
 *  поэтому заявка никуда не уходит, а форма просто показывает «отправлено». */
const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

/** Подсказка, если пытаются отправить без согласия (ТЗ 152-ФЗ). */
const CONSENT_HINT = "Для отправки заявки нужно согласие на обработку персональных данных";

type Status = "idle" | "sending" | "sent" | "error" | "consent";

export default function LeadForm({
  autoFocus = false,
  service,
  note,
}: {
  autoFocus?: boolean;
  /** из какой услуги открыли заявку — показывается в шапке и уходит с формой */
  service?: string;
  /** пояснение над полями (например, «инструмент в разработке») */
  note?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const sent = status === "sent";

  const submit = async (form: HTMLFormElement) => {
    setStatus("sending");
    if (DEMO) {
      window.setTimeout(() => setStatus("sent"), 600);
      return;
    }
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        // urlencoded, не multipart: фаервол reg.ru с 22.10.2026 отвечает 403
        // на любой multipart-POST к обработчику, ещё до PHP
        body: new URLSearchParams(
          [...new FormData(form)].map(([k, v]) => [k, String(v)])
        ),
        headers: { Accept: "application/json" },
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      setStatus(res.ok && data?.ok ? "sent" : data?.error === "consent" ? "consent" : "error");
    } catch {
      setStatus("error");
    }
  };
  const phoneField = usePhoneField();
  const nameRef = useRef<HTMLInputElement>(null);

  // Фокус в первое поле — только там, где есть мышь: на телефоне он сразу
  // выдвинул бы клавиатуру поверх попапа.
  useEffect(() => {
    if (autoFocus && window.matchMedia("(hover: hover)").matches) {
      nameRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (status === "sending" || sent) return;
        void submit(e.currentTarget);
      }}
    >
      <div className="form__head">
        <span className="form__title">Заявка</span>
      </div>
      {note && <p className="form__note">{note}</p>}
      {service && (
        <div className="form__service">
          <span className="form__service-label">Услуга</span>
          <span className="form__service-name">{service}</span>
          <input type="hidden" name="service" value={service} />
        </div>
      )}
      <label className="field">
        <span className="field__label">
          <span className="field__n">01</span>Имя
        </span>
        <input name="name" placeholder="Как&nbsp;к&nbsp;вам обращаться" ref={nameRef} />
      </label>
      <label className="field">
        <span className="field__label">
          <span className="field__n">02</span>Почта
        </span>
        <input name="email" type="email" placeholder="name@company.ru" />
      </label>
      <label className="field">
        <span className="field__label">
          <span className="field__n">03</span>Телефон
          <span className="field__req" aria-hidden="true">*</span>
        </span>
        {/* Телефон обязателен — по нему перезваниваем. pattern требует номер
            целиком в формате маски, иначе проходил бы и «+7 (91». */}
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 (___) ___-__-__"
          {...phoneField}
          required
          pattern="\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}"
          title="Введите номер полностью: +7&nbsp;(999)&nbsp;123-45-67"
          aria-required="true"
        />
      </label>
      <label className="consent">
        {/* Обязательная галочка, по умолчанию пустая; autoComplete="off" —
            чтобы браузер не восстанавливал отметку при возврате на страницу. */}
        <input
          type="checkbox"
          name="consent"
          required
          autoComplete="off"
          onInvalid={(e) => e.currentTarget.setCustomValidity(CONSENT_HINT)}
          onChange={(e) => e.currentTarget.setCustomValidity("")}
        />
        <span>
          Даю <LegalLink doc="consent" newTab className="consent__link">
            согласие на&nbsp;обработку персональных данных
          </LegalLink>{" "}
          в&nbsp;соответствии с&nbsp;<LegalLink doc="privacy" newTab className="consent__link">
            Политикой
          </LegalLink>
        </span>
      </label>
      {/* Отдельная галочка: согласие на рекламу нельзя зашивать
          в согласие на обработку персональных данных. */}
      <label className="consent consent--optional">
        <input type="checkbox" name="marketing" autoComplete="off" />
        <span>
          Даю <LegalLink doc="mailing" newTab className="consent__link">
            согласие на&nbsp;получение рекламных рассылок
          </LegalLink>{" "}
          и&nbsp;новостей SIRENS
        </span>
      </label>
      {/* Ловушка для ботов: люди поле не видят и не заполняют. */}
      <input
        type="text"
        name="company"
        className="form__trap"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <button type="submit" className="submit" disabled={status === "sending" || sent}>
        {sent ? "Заявка отправлена" : status === "sending" ? "Отправляем…" : "Отправить"}
        <span className="submit__arrow">↗</span>
      </button>
      {status === "consent" && (
        <p className="form__error" role="alert">
          {CONSENT_HINT}
        </p>
      )}
      {status === "error" && (
        <p className="form__error" role="alert">
          Не&nbsp;получилось отправить. Напишите нам на 
          <a href="mailto:SirensLLC@yandex.ru">SirensLLC@yandex.ru</a> или&nbsp;позвоните.
        </p>
      )}
    </form>
  );
}
