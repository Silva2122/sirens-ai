"use client";

import { useEffect, useRef } from "react";
import { usePhoneField } from "@/components/LeadForm";
import type { Contact } from "@/lib/api";

/** Читает контакты из полей, которые рисует ContactFields. */
export function contactFrom(form: HTMLFormElement): Contact {
  const data = new FormData(form);
  const get = (k: string) => String(data.get(k) ?? "").trim();
  return {
    name: get("name"),
    company: get("company"),
    position: get("position"),
    phone: get("phone"),
    email: get("email"),
  };
}

/**
 * Имя, компания, должность, телефон, почта — все обязательные. Общие для финального
 * шага квиза и регистрации в кабинете; defaults подставляют то, что человек
 * уже ввёл в квизе.
 */
export default function ContactFields({
  defaults,
  autoFocus = false,
}: {
  defaults?: Partial<Contact>;
  autoFocus?: boolean;
}) {
  const phoneField = usePhoneField(defaults?.phone ?? "");
  const nameRef = useRef<HTMLInputElement>(null);

  // как в форме заявки: фокус только там, где есть мышь
  useEffect(() => {
    if (autoFocus && window.matchMedia("(hover: hover)").matches) nameRef.current?.focus();
  }, [autoFocus]);

  return (
    <div className="contact-fields">
      <label className="field">
        <span className="field__label">
          Имя<span className="field__req" aria-hidden="true">*</span>
        </span>
        <input
          name="name"
          autoComplete="name"
          placeholder="Как&nbsp;к&nbsp;вам обращаться"
          defaultValue={defaults?.name}
          ref={nameRef}
          required
        />
      </label>
      <label className="field">
        <span className="field__label">
          Компания<span className="field__req" aria-hidden="true">*</span>
        </span>
        <input
          name="company"
          autoComplete="organization"
          placeholder="ООО «Компания»"
          defaultValue={defaults?.company}
          required
        />
      </label>
      <label className="field">
        <span className="field__label">
          Должность<span className="field__req" aria-hidden="true">*</span>
        </span>
        <input
          name="position"
          autoComplete="organization-title"
          placeholder="Например, руководитель службы ОТ"
          defaultValue={defaults?.position}
          required
        />
      </label>
      <label className="field">
        <span className="field__label">
          Телефон<span className="field__req" aria-hidden="true">*</span>
        </span>
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
        />
      </label>
      <label className="field">
        <span className="field__label">
          Почта<span className="field__req" aria-hidden="true">*</span>
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.ru"
          defaultValue={defaults?.email}
          required
        />
      </label>
    </div>
  );
}
