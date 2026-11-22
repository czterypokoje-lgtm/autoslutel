/*
 * One reading of a typed euro amount, for every form and every import.
 *
 * Before this file each screen had its own parser, and they disagreed: the
 * supplier ledger read "1.500" as € 1,50, the bank import read "1234.56" as
 * € 123.456,00, and the purchase form turned "1.234,56" into "no price".
 *
 * Pure on purpose (no imports), so the browser, the server and node --test
 * all run the same code.
 */

export interface EuroOptions {
  /** Accept a leading or trailing minus/plus (bank statements). Default: unsigned only. */
  signed?: boolean;
  /**
   * How to read dots with exactly three digits behind them and no comma
   * ("1.500"). In a Dutch form a person typed fifteen hundred, so the default
   * is thousands. A spreadsheet cell can just as well be the number 1.5 with a
   * trailing zero, so imports pass false and the row is refused, not guessed.
   */
  dutchThousands?: boolean;
}

/**
 * "12,50" · "12.50" · "1.234,56" · "1,234.56" · "€ 1 250" · "1.500" → cents.
 * Empty → null. Unreadable (letters, three decimals, "1,500") → NaN, so the
 * caller can refuse the amount instead of booking a guess.
 */
export function euroToCents(raw: string, options: EuroOptions = {}): number | null {
  const { signed = false, dutchThousands = true } = options;
  let s = String(raw ?? '').replace(/[€\s ]/g, '').replace(/^eur/i, '');
  if (!s) return null;

  let sign = 1;
  if (signed) {
    if (/^[+-]/.test(s)) { sign = s[0] === '-' ? -1 : 1; s = s.slice(1); }
    else if (/[+-]$/.test(s)) { sign = s.endsWith('-') ? -1 : 1; s = s.slice(0, -1); }
  }

  const comma = s.lastIndexOf(',');
  const dot = s.lastIndexOf('.');
  if (comma > -1 && dot > -1) {
    // Both marks: the last one is the decimal mark, the other groups thousands.
    s = comma > dot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (comma > -1) {
    s = s.replace(',', '.');
  } else if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(s)) {
    if (!dutchThousands) return NaN;
    s = s.replace(/\./g, '');
  }

  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  const cents = Math.round(Number(s) * 100);
  return Number.isSafeInteger(cents) ? sign * cents : NaN;
}
