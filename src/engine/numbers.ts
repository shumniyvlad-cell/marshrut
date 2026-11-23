// Нумерология, психоматрица Пифагора, Матрица судьбы (метод Ладини).

export const digitSum = (n: number) => String(Math.abs(n)).split('').reduce((s, c) => s + Number(c), 0);
export const digitsOf = (s: string) => s.replace(/\D/g, '').split('').map(Number);

/** Свести к 1–9, мастер-числа 11, 22, 33 сохранить. */
export function reduceMaster(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = digitSum(n);
  return n;
}
export function reduce9(n: number): number {
  while (n > 9) n = digitSum(n);
  return n;
}
/** Свести к арканам 1–22. */
export function reduce22(n: number): number {
  while (n > 22) n = digitSum(n);
  return n === 0 ? 22 : n;
}

export interface Ymd { y: number; m: number; d: number }

export function lifePath({y, m, d}: Ymd) {
  // классика: сумма всех цифр даты
  return reduceMaster(digitSum(d) + digitSum(m) + digitSum(y));
}
export function personalYear({m, d}: Ymd, year: number) {
  return reduce9(digitSum(d) + digitSum(m) + digitSum(year));
}

const RU = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
const RU_VOWELS = new Set('аеёиоуыэюя'.split(''));
const LAT = 'abcdefghijklmnopqrstuvwxyz';
const LAT_VOWELS = new Set('aeiouy'.split(''));
function letterValue(ch: string): {v: number; vowel: boolean} | null {
  const c = ch.toLowerCase();
  const i = RU.indexOf(c);
  if (i >= 0) return {v: (i % 9) + 1, vowel: RU_VOWELS.has(c)};
  const j = LAT.indexOf(c);
  if (j >= 0) return {v: (j % 9) + 1, vowel: LAT_VOWELS.has(c)};
  return null;
}
export function nameNumbers(name: string) {
  let all = 0, vow = 0, con = 0, count = 0;
  for (const ch of name) {
    const lv = letterValue(ch);
    if (!lv) continue;
    count++;
    all += lv.v;
    if (lv.vowel) vow += lv.v; else con += lv.v;
  }
  if (count === 0) return null;
  return {expression: reduceMaster(all), soul: reduceMaster(vow || 0) || 1, personality: reduceMaster(con || 0) || 1};
}

export interface Pythagoras {
  working: [number, number, number, number];
  cells: Record<number, number>; // цифра → сколько раз
  lines: Record<string, number>;
}
export const PY_LINES: Record<string, number[]> = {
  row1: [1, 4, 7], row2: [2, 5, 8], row3: [3, 6, 9],
  col1: [1, 2, 3], col2: [4, 5, 6], col3: [7, 8, 9],
  diag1: [1, 5, 9], diag2: [3, 5, 7],
};
export function pythagoras({y, m, d}: Ymd): Pythagoras {
  const date = `${String(d).padStart(2, '0')}${String(m).padStart(2, '0')}${y}`;
  const ds = digitsOf(date);
  const first = ds.reduce((s, x) => s + x, 0);
  const second = digitSum(first);
  const firstDayDigit = digitsOf(String(d))[0];
  const third = y >= 2000 ? first + 19 : Math.abs(first - 2 * firstDayDigit);
  const fourth = digitSum(third);
  const all = [...ds, ...digitsOf(`${first}${second}${third}${fourth}`)];
  const cells: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) cells[i] = all.filter((x) => x === i).length;
  const lines: Record<string, number> = {};
  for (const [k, v] of Object.entries(PY_LINES)) lines[k] = v.reduce((s, c) => s + cells[c], 0);
  return {working: [first, second, third, fourth], cells, lines};
}

export interface DestinyMatrix {
  A: number; B: number; C: number; D: number; E: number;
  F: number; G: number; H: number; I: number;
  tail: [number, number, number]; // D, D1, D2
  talent: [number, number, number]; // B, B1, B2
  money: number; love: number; balance: number;
  sky: number; earth: number; personal: number;
  male: number; female: number; social: number; spiritual: number;
  comfort: number;
}
export function destinyMatrix({y, m, d}: Ymd): DestinyMatrix {
  const r = reduce22;
  const A = r(d), B = r(m), C = r(digitSum(y));
  const D = r(A + B + C);
  const E = r(A + B + C + D);
  const F = r(A + B), G = r(B + C), H = r(C + D), I = r(D + A);
  const D2 = r(D + E), D1 = r(D + D2);
  const B2 = r(B + E), B1 = r(B + B2);
  const C2 = r(C + E);
  const balance = r(C2 + D2);
  const money = r(balance + C2);
  const love = r(balance + D2);
  const sky = r(B + D), earth = r(A + C), personal = r(sky + earth);
  const male = r(F + H), female = r(G + I), social = r(male + female);
  const spiritual = r(personal + social);
  return {A, B, C, D, E, F, G, H, I, tail: [D, D1, D2], talent: [B, B1, B2], money, love, balance, sky, earth, personal, male, female, social, spiritual, comfort: E};
}
