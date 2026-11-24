// Один вход: данные человека → все расчёты.
import {natalChart, type NatalChart} from './astro';
import {hdChart, type HdChart} from './hd';
import {destinyMatrix, lifePath, nameNumbers, personalYear, pythagoras, type DestinyMatrix, type Pythagoras} from './numbers';
import {bazi, type BaZi} from './bazi';
import {localToUtc} from './time';

export interface Place { name: string; lat: number; lon: number; tz: string }
export interface Person {
  id: string;
  name: string;
  y: number; m: number; d: number;
  h: number | null; min: number | null; // null — время неизвестно
  place: Place | null;
  note?: string;
  from?: string; // точка А: где человек сейчас (для краткого разбора)
  to?: string;   // точка Б: куда хочет
  createdAt: number;
}

export interface Calc {
  person: Person;
  timeKnown: boolean;
  utc: Date;
  offset: number;
  natal: NatalChart;
  hd: HdChart;
  matrix: DestinyMatrix;
  py: Pythagoras;
  lifePath: number;
  personalYear: number;
  year: number;
  name: ReturnType<typeof nameNumbers>;
  bazi: BaZi;
}

export function compute(p: Person, today = new Date()): Calc {
  const timeKnown = p.h !== null && p.min !== null && p.place !== null;
  const h = p.h ?? 12, min = p.min ?? 0;
  const tz = p.place?.tz ?? 'UTC';
  const {utc, offset} = localToUtc(p.y, p.m, p.d, h, min, tz);
  const ymd = {y: p.y, m: p.m, d: p.d};
  const year = today.getFullYear();
  return {
    person: p, timeKnown, utc, offset,
    natal: natalChart(utc, p.place?.lat ?? null, p.place?.lon ?? null, timeKnown),
    hd: hdChart(utc),
    matrix: destinyMatrix(ymd),
    py: pythagoras(ymd),
    lifePath: lifePath(ymd),
    personalYear: personalYear(ymd, year),
    year,
    name: nameNumbers(p.name),
    bazi: bazi(utc, {...ymd, h: p.h}),
  };
}

export {localToUtc};
