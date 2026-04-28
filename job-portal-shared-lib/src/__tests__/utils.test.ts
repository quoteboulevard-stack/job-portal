import { isValidEmail, isValidPassword, isValidPhone, isValidURL } from "../utils/validators";
import { formatDate, formatCurrency, formatPercentage, formatPhone, calculateDaysSince, getDaysUntilExpiry } from "../utils/formatters";
import { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, isAppError, toAppError } from "../utils/errorHandler";

// --- Validators ---
describe("isValidEmail", () => {
  it.each(["user@example.com", "a+b@x.co.uk", "  user@example.com  "])("accepts %s", (v) => expect(isValidEmail(v)).toBe(true));
  it.each(["", "notanemail", "@no.com", "no@", "no space @x.com"])("rejects %s", (v) => expect(isValidEmail(v)).toBe(false));
});

describe("isValidPassword", () => {
  it("accepts valid password", () => expect(isValidPassword("Secure1!")).toBe(true));
  it("rejects too short", () => expect(isValidPassword("Sh0rt!")).toBe(false));
  it("rejects missing uppercase", () => expect(isValidPassword("secure1!")).toBe(false));
  it("rejects missing number", () => expect(isValidPassword("SecurePass!")).toBe(false));
  it("rejects missing special char", () => expect(isValidPassword("Secure123")).toBe(false));
  it("respects custom policy", () => expect(isValidPassword("simple", { minLength: 4 })).toBe(true));
});

describe("isValidPhone", () => {
  it.each(["+1 800 555-1234", "07911123456", "(555) 123-4567"])("accepts %s", (v) => expect(isValidPhone(v)).toBe(true));
  it.each(["123", "not-a-phone!!!!!!!!!!!!"])("rejects %s", (v) => expect(isValidPhone(v)).toBe(false));
});

describe("isValidURL", () => {
  it.each(["https://example.com", "http://sub.domain.org/path?q=1"])("accepts %s", (v) => expect(isValidURL(v)).toBe(true));
  it.each(["ftp://bad.com", "just-text", "//no-protocol.com"])("rejects %s", (v) => expect(isValidURL(v)).toBe(false));
});

// --- Formatters ---
describe("formatDate", () => {
  it("formats a date string", () => expect(formatDate("2024-01-15")).toBe("Jan 15, 2024"));
  it("formats a Date object", () => expect(formatDate(new Date(2024, 0, 15))).toBe("Jan 15, 2024"));
  it("respects custom options", () => expect(formatDate("2024-01-15", "en-US", { year: "numeric" })).toBe("2024"));
});

describe("formatCurrency", () => {
  it("formats USD", () => expect(formatCurrency(1234.5)).toBe("$1,234.50"));
  it("formats EUR", () => expect(formatCurrency(99, "EUR", "de-DE")).toContain("99"));
  it("handles zero", () => expect(formatCurrency(0)).toBe("$0.00"));
  it("handles negative", () => expect(formatCurrency(-50)).toBe("-$50.00"));
});

describe("formatPercentage", () => {
  it("formats 50 as 50.0%", () => expect(formatPercentage(50)).toBe("50.0%"));
  it("formats 0", () => expect(formatPercentage(0)).toBe("0.0%"));
  it("formats 100", () => expect(formatPercentage(100)).toBe("100.0%"));
  it("respects decimals param", () => expect(formatPercentage(33.333, 2)).toBe("33.3%"));
});

describe("formatPhone", () => {
  it("formats 10-digit", () => expect(formatPhone("8005551234")).toBe("(800) 555-1234"));
  it("formats 11-digit with country code", () => expect(formatPhone("18005551234")).toBe("+1 (800) 555-1234"));
  it("returns original for unrecognized", () => expect(formatPhone("+44 7911 123456")).toBe("+44 7911 123456"));
  it("strips non-digits before formatting", () => expect(formatPhone("(800) 555-1234")).toBe("(800) 555-1234"));
});

describe("calculateDaysSince", () => {
  it("returns 0 for today", () => expect(calculateDaysSince(new Date())).toBe(0));
  it("returns positive for past date", () => {
    const past = new Date(Date.now() - 5 * 86_400_000);
    expect(calculateDaysSince(past)).toBe(5);
  });
});

describe("getDaysUntilExpiry", () => {
  it("returns positive for future date", () => {
    const future = new Date(Date.now() + 10 * 86_400_000);
    expect(getDaysUntilExpiry(future)).toBe(10);
  });
  it("returns negative for past date", () => {
    const past = new Date(Date.now() - 3 * 86_400_000);
    expect(getDaysUntilExpiry(past)).toBe(-3);
  });
});

// --- Error Handler ---
describe("AppError", () => {
  it("sets all properties", () => {
    const e = new AppError("fail", "INTERNAL_ERROR", 500, false);
    expect(e.message).toBe("fail");
    expect(e.code).toBe("INTERNAL_ERROR");
    expect(e.statusCode).toBe(500);
    expect(e.isOperational).toBe(false);
    expect(e instanceof Error).toBe(true);
  });
});

describe("error subclasses", () => {
  it("ValidationError — 400 with fields", () => {
    const e = new ValidationError("bad input", { email: "invalid" });
    expect(e.statusCode).toBe(400);
    expect(e.fields).toEqual({ email: "invalid" });
  });
  it("NotFoundError — 404", () => expect(new NotFoundError("User").statusCode).toBe(404));
  it("UnauthorizedError — 401 default message", () => expect(new UnauthorizedError().message).toBe("Unauthorized"));
  it("ForbiddenError — 403", () => expect(new ForbiddenError().statusCode).toBe(403));
  it("ConflictError — 409", () => expect(new ConflictError("duplicate").statusCode).toBe(409));
});

describe("isAppError", () => {
  it("returns true for AppError instances", () => expect(isAppError(new NotFoundError("x"))).toBe(true));
  it("returns false for plain Error", () => expect(isAppError(new Error("x"))).toBe(false));
  it("returns false for non-Error values", () => expect(isAppError("string")).toBe(false));
});

describe("toAppError", () => {
  it("passes through AppError unchanged", () => {
    const e = new ConflictError("dup");
    expect(toAppError(e)).toBe(e);
  });
  it("wraps plain Error", () => {
    const e = toAppError(new Error("boom"));
    expect(e.code).toBe("INTERNAL_ERROR");
    expect(e.message).toBe("boom");
    expect(e.isOperational).toBe(false);
  });
  it("wraps string", () => expect(toAppError("oops").message).toBe("oops"));
});
