"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ContactFields, { contactFrom } from "@/components/ContactFields";
import LegalLink from "@/components/LegalLink";
import { TileTitle } from "@/components/cabinet/Widgets";
import { ApiError, lastQuizResult, register, type Contact } from "@/lib/api";
import { typo } from "@/lib/typo";

const MIN_PASSWORD = 8;

/**
 * Регистрация. Если человек только что прошёл квиз, контакты уже известны —
 * подставляем их, остаётся придумать пароль.
 */
export default function RegisterForm() {
  const router = useRouter();
  const [defaults, setDefaults] = useState<Contact | null>(null);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // localStorage есть только в браузере — читаем после монтирования
  useEffect(() => {
    setDefaults(lastQuizResult()?.contact ?? null);
    setReady(true);
  }, []);

  const submit = async (form: HTMLFormElement) => {
    const password = String(new FormData(form).get("password"));
    if (password.length < MIN_PASSWORD) {
      setError(typo(`Пароль — не короче ${MIN_PASSWORD} символов`));
      return;
    }
    setSending(true);
    setError(null);
    try {
      await register(contactFrom(form), password);
      router.replace("/cabinet/");
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === "exists"
          ? "Аккаунт с\u00a0этой почтой уже есть\u00a0— войдите"
          : "Не\u00a0получилось зарегистрироваться. Попробуйте ещё раз."
      );
      setSending(false);
    }
  };

  return (
    <form
      className="tile auth__card"
      onSubmit={(e) => {
        e.preventDefault();
        if (!sending) void submit(e.currentTarget);
      }}
    >
      <TileTitle icon="addUser">Регистрация</TileTitle>
      {defaults && (
        <p className="tile__meta">Подставили контакты из&nbsp;экспресс-теста&nbsp;— осталось придумать пароль.</p>
      )}
      {/* key: поля с defaultValue перерисовываем, когда подтянулись данные квиза */}
      {ready && <ContactFields key={defaults ? "quiz" : "empty"} defaults={defaults ?? undefined} />}
      <label className="field">
        <span className="field__label">
          Пароль<span className="field__req" aria-hidden="true">*</span>
        </span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={`Не короче ${MIN_PASSWORD} символов`}
          required
        />
      </label>
      <label className="consent consent--optional">
        <input type="checkbox" name="consent" required />
        <span>
          Даю <LegalLink doc="consent" className="consent__link">
            согласие на&nbsp;обработку персональных данных
          </LegalLink>{" "}
          в&nbsp;соответствии с&nbsp;<LegalLink doc="privacy" className="consent__link">
            Политикой
          </LegalLink>
        </span>
      </label>
      {error && (
        <p className="form__error auth__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="cta cta--md auth__submit" disabled={sending}>
        {sending ? "Создаём кабинет…" : "Зарегистрироваться"}
        <span className="cta__arrow">↗</span>
      </button>
      <p className="auth__switch">
        Уже есть аккаунт? <Link href="/cabinet/login/">Войдите</Link>
      </p>
    </form>
  );
}
