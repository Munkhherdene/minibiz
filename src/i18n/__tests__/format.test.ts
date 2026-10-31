import { formatDate, formatDateTime, formatDayLong, formatTime } from '../format';

// Local-time constructor, so results don't depend on the machine's time zone.
const saturday = new Date(2026, 9, 31, 14, 5);

describe('Mongolian date formatting', () => {
  it('formats dates as YYYY.MM.DD', () => {
    expect(formatDate(saturday)).toBe('2026.10.31');
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026.01.05');
  });

  it('formats 24-hour time', () => {
    expect(formatTime(saturday)).toBe('14:05');
    expect(formatDateTime(saturday)).toBe('2026.10.31 14:05');
  });

  it('formats the long day with month and weekday', () => {
    expect(formatDayLong(saturday)).toBe('10-р сарын 31, Бямба');
  });
});
