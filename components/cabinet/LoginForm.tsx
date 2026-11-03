"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TileTitle } from "@/components/cabinet/Widgets";
import { ApiError, login } from "@/lib/api";

export default function LoginForm() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    setSending(true);
    setError(null);
    try {
      await login(String(data.get("email")), String(data.get("password")));
      router.replace("/cabinet/");
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === "credentials"
          ? "Неверная почта или\u00a0пароль"
          : "Не\u00a0получилось войти. Попробуйте ещё раз."
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
      <TileTitle icon="key">Вход в&nbsp;кабинет</TileTitle>
      <label className="field">
        <span className="field__label">Почта</span>
        <input name="email" type="email" autoComplete="email" placeholder="name@company.ru" required />
      </label>
      <label className="field">
        <span className="field__label">Пароль</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="cta cta--md auth__submit" disabled={sending}>
        {sending ? "Входим…" : "Войти"}
        <span className="cta__arrow">↗</span>
      </button>
      <p className="auth__switch">
        Нет аккаунта? <Link href="/cabinet/register/">Зарегистрируйтесь</Link>
      </p>
    </form>
  );
}
