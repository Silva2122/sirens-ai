<?php
/**
 * Приём заявки с сайта. Форма (components/LeadForm.tsx) шлёт сюда POST с
 * полями name, email, phone, service, consent, marketing и ловушкой company.
 * Письмо уходит на почту SIRENS; в теме — услуга, по которой оставили заявку.
 * Статический экспорт Next не умеет серверную часть, а на хостинге reg.ru
 * есть PHP — поэтому обработчик живёт отдельным файлом в public/.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const RECIPIENTS = ['SirensLLC@yandex.ru', 'info@sirens-hse.ru'];
const FROM = 'noreply@sirens-hse.ru';

function fail(int $code, string $msg): never {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  fail(405, 'method');
}

$clean = static fn(string $k, int $max): string =>
  mb_substr(trim(str_replace(["\r", "\n"], ' ', (string)($_POST[$k] ?? ''))), 0, $max);

// ловушка заполнена — бот; отвечаем «ок», чтобы не подсказывать
if ($clean('company', 100) !== '') {
  echo json_encode(['ok' => true]);
  exit;
}

$name    = $clean('name', 120);
$email   = $clean('email', 160);
$phone   = $clean('phone', 40);
$service = $clean('service', 200);
$consent = isset($_POST['consent']);
$marketing = isset($_POST['marketing']);

if (!preg_match('/\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}/u', $phone)) {
  fail(422, 'phone');
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  fail(422, 'email');
}
if (!$consent) {
  fail(422, 'consent');
}

$subject = 'Заявка с сайта' . ($service !== '' ? ': ' . $service : '');
$lines = [
  'Новая заявка с sirens-hse.ru',
  '',
  'Услуга:   ' . ($service !== '' ? $service : '— (общая заявка)'),
  'Имя:      ' . ($name !== '' ? $name : '—'),
  'Телефон:  ' . $phone,
  'Почта:    ' . ($email !== '' ? $email : '—'),
  'Рассылка: ' . ($marketing ? 'согласен' : 'нет'),
  '',
  'Время:    ' . date('d.m.Y H:i') . ' (сервер)',
  'Страница: ' . ($_SERVER['HTTP_REFERER'] ?? '—'),
];

$encode = static fn(string $s): string => '=?UTF-8?B?' . base64_encode($s) . '?=';
$headers = [
  'From: ' . $encode('Сайт SIRENS') . ' <' . FROM . '>',
  'Reply-To: ' . ($email !== '' ? $email : FROM),
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: 8bit',
  'X-Mailer: sirens-site',
];

// тестовый прогон (?test=1) — только на внутренний ящик, клиентскую почту не трогаем
$to = isset($_GET['test']) ? ['info@sirens-hse.ru'] : RECIPIENTS;

$ok = mail(implode(', ', $to), $encode($subject), implode("\n", $lines), implode("\r\n", $headers));
if (!$ok) {
  fail(500, 'mail');
}
echo json_encode(['ok' => true]);
