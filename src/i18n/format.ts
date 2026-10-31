// Mongolian date formatting without relying on Intl locale data.

const WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDate(value: Date | string) {
  return typeof value === 'string' ? new Date(value) : value;
}

/** "2026.10.31" */
export function formatDate(value: Date | string): string {
  const date = toDate(value);
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/** "14:05" */
export function formatTime(value: Date | string): string {
  const date = toDate(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "2026.10.31 14:05" */
export function formatDateTime(value: Date | string): string {
  return `${formatDate(value)} ${formatTime(value)}`;
}

/** "10-р сарын 31, Бямба" */
export function formatDayLong(value: Date | string): string {
  const date = toDate(value);
  return `${date.getMonth() + 1}-р сарын ${date.getDate()}, ${WEEKDAYS[date.getDay()]}`;
}
