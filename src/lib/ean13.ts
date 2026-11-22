/**
 * EAN-13 for shelf labels: the 13-digit number a shop's existing drawer
 * labels carry (e.g. 3921962874003) stays on our own label, so the drawer
 * keeps its number and the barcode learned for it (kfc_articles.ean) scans.
 */

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const R = L.map((pattern) => [...pattern].map((bit) => (bit === '1' ? '0' : '1')).join(''));
const G = R.map((pattern) => [...pattern].reverse().join(''));
/** Which of L/G encodes digits 2–7, chosen by the first digit. */
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

export function ean13Valid(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const sum = [...code.slice(0, 12)].reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(code[12]);
}

/** The 95 modules ('1' bar, '0' space), guards included; null for anything that is not a valid EAN-13. */
export function ean13Modules(code: string): string | null {
  if (!ean13Valid(code)) return null;
  const parity = PARITY[Number(code[0])];
  let modules = '101';
  for (let index = 1; index <= 6; index++) modules += (parity[index - 1] === 'L' ? L : G)[Number(code[index])];
  modules += '01010';
  for (let index = 7; index <= 12; index++) modules += R[Number(code[index])];
  return `${modules}101`;
}
