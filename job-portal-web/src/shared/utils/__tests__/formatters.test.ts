import { formatCurrency, formatRelativeDate, formatShortDate, truncate, initials } from '../formatters';

describe('formatCurrency', () => {
  it('formats whole dollar amounts', () => {
    expect(formatCurrency(5000)).toContain('5,000');
  });
  it('uses the provided currency', () => {
    expect(formatCurrency(100, 'EUR')).toMatch(/€|EUR/);
  });
});

describe('formatRelativeDate', () => {
  const now = new Date();
  it('returns "just now" for < 1 min', () => {
    expect(formatRelativeDate(new Date(now.getTime() - 30_000))).toBe('just now');
  });
  it('returns minutes ago', () => {
    expect(formatRelativeDate(new Date(now.getTime() - 5 * 60_000))).toBe('5m ago');
  });
  it('returns hours ago', () => {
    expect(formatRelativeDate(new Date(now.getTime() - 3 * 3_600_000))).toBe('3h ago');
  });
  it('returns days ago', () => {
    expect(formatRelativeDate(new Date(now.getTime() - 2 * 86_400_000))).toBe('2d ago');
  });
  it('returns formatted date for > 7 days', () => {
    const old = new Date(now.getTime() - 10 * 86_400_000);
    expect(formatRelativeDate(old)).toMatch(/[A-Za-z]+ \d+/);
  });
});

describe('formatShortDate', () => {
  it('returns a readable date string', () => {
    const result = formatShortDate(new Date('2024-06-15'));
    expect(result).toMatch(/Jun/i);
    expect(result).toContain('15');
  });
});

describe('truncate', () => {
  it('returns the original string if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });
  it('truncates and appends ellipsis', () => {
    const result = truncate('hello world', 5);
    expect(result).toMatch(/…$/);
  });
});

describe('initials', () => {
  it('returns initials for a full name', () => {
    expect(initials('John Doe')).toBe('JD');
  });
  it('returns single initial for one word', () => {
    expect(initials('Alice')).toBe('A');
  });
  it('handles extra spaces gracefully', () => {
    expect(initials('  Jane  Smith  ')).toBe('JS');
  });
});
