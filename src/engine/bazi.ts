// Ба Цзы: четыре столпа. Год и месяц — по солнечным сезонам (Ли Чунь = 315°), день — по шестидесятеричному циклу.
import * as A from 'astronomy-engine';
import {longitude, norm} from './astro';

export const STEMS = ['jia', 'yi', 'bing', 'ding', 'wu', 'ji', 'geng', 'xin', 'ren', 'gui'] as const;
export type Stem = (typeof STEMS)[number];
export const STEM_HAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCH_HAN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const ANIMALS = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'] as const;
export type Animal = (typeof ANIMALS)[number];
export const ANIMAL_RU: Record<Animal, string> = {
  rat: 'Крыса', ox: 'Бык', tiger: 'Тигр', rabbit: 'Кролик', dragon: 'Дракон', snake: 'Змея',
  horse: 'Лошадь', goat: 'Коза', monkey: 'Обезьяна', rooster: 'Петух', dog: 'Собака', pig: 'Свинья',
};
export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export const ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
export const ELEMENT_RU: Record<Element, string> = {wood: 'Дерево', fire: 'Огонь', earth: 'Земля', metal: 'Металл', water: 'Вода'};
export const stemElement = (s: number): Element => ELEMENTS[Math.floor(s / 2)];
const BRANCH_ELEMENT: Element[] = ['water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water'];
export const branchElement = (b: number) => BRANCH_ELEMENT[b];
export const pillarRu = (s: number, b: number) =>
  `${s % 2 === 0 ? 'Ян' : 'Инь'} ${ELEMENT_RU[stemElement(s)]}, ${ANIMAL_RU[ANIMALS[b]]}`;

export interface Pillar { stem: number; branch: number }
export interface BaZi {
  year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null;
  dayMaster: Stem;
  counts: Record<Element, number>;
  excess: Element[];
  lack: Element[];
  animal: Animal;
}

function jdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** utc — момент рождения; local — местная дата и время (для столпов дня и часа). */
export function bazi(utc: Date, local: {y: number; m: number; d: number; h: number | null}): BaZi {
  // Год начинается с Ли Чунь (Солнце на 315°)
  const lichun = A.SearchSunLongitude(315, new Date(Date.UTC(local.y, 0, 25)), 20);
  const by = lichun && utc < lichun.date ? local.y - 1 : local.y;
  const yStem = ((by - 4) % 10 + 10) % 10;
  const yBranch = ((by - 4) % 12 + 12) % 12;
  const sun = longitude('sun', utc);
  const mi = Math.floor(norm(sun - 315) / 30); // 0 = месяц Тигра (Инь)
  const mBranch = (2 + mi) % 12;
  const mStem = (((yStem % 5) * 2 + 2) + mi) % 10;
  const cyc = (jdn(local.y, local.m, local.d) + 49) % 60;
  const dStem = cyc % 10, dBranch = cyc % 12;
  let hour: Pillar | null = null;
  if (local.h !== null) {
    let hb = Math.floor((local.h + 1) / 2) % 12;
    // час Крысы после 23:00 относится к следующему дню по стволу — оставляем полночную границу дня, ствол часа по текущему дню
    if (hb < 0) hb = 0;
    hour = {stem: (((dStem % 5) * 2) + hb) % 10, branch: hb};
  }
  const pillars = [{stem: yStem, branch: yBranch}, {stem: mStem, branch: mBranch}, {stem: dStem, branch: dBranch}, ...(hour ? [hour] : [])];
  const counts: Record<Element, number> = {wood: 0, fire: 0, earth: 0, metal: 0, water: 0};
  for (const p of pillars) { counts[stemElement(p.stem)]++; counts[branchElement(p.branch)]++; }
  const total = pillars.length * 2;
  const excess = ELEMENTS.filter((e) => counts[e] >= Math.max(3, Math.ceil(total * 0.375)));
  const lack = ELEMENTS.filter((e) => counts[e] === 0);
  return {
    year: pillars[0], month: pillars[1], day: pillars[2], hour,
    dayMaster: STEMS[dStem], counts, excess, lack, animal: ANIMALS[yBranch],
  };
}
