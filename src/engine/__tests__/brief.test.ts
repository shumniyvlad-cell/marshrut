import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {compute, type Person} from '../index';
import {buildRoute} from '../route';
import {buildBrief, digits, isHuman} from '../brief';
import type {Library} from '../../content';

const dir = join(__dirname, '../../content');
const j = (f: string) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
const lib: Library = {
  signs: {...j('astro-signs-a.json'), ...j('astro-signs-b.json')},
  houses: j('astro-houses.json'),
  hd: {...j('hd-core.json'), ...j('hd-gates.json')},
  matrix: j('matrix.json').arcana,
  numbers: j('numbers.json'),
  east: j('east.json'),
};
function rnd(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

describe('пять показателей по системе Юли', () => {
  it('Владислав 11.11.1991 → 2, 6, 2, 5, 5', () => {
    const d = digits('Владислав', '1991-11-11', new Date(2026, 10, 24))!;
    expect([d.day, d.path, d.month, d.name, d.year]).toEqual([2, 6, 2, 5, 5]);
    expect([d.yearFrom, d.yearTo]).toEqual(['2026-11-11', '2027-11-11']);
  });
  it('личный год меняется в день рождения, а не 1 января', () => {
    const before = digits('Анна', '1990-05-12', new Date(2026, 4, 11))!;
    const after = digits('Анна', '1990-05-12', new Date(2026, 4, 12))!;
    expect(before.yearFrom).toBe('2025-05-12');
    expect(after.yearFrom).toBe('2026-05-12');
  });
  it('считает по имени без фамилии', () => {
    const p: Person = {id: 'v', name: 'Владислав Шумный', y: 1991, m: 11, d: 11, h: 12, min: 0, place: {name: 'x', lat: 55, lon: 37, tz: 'Europe/Moscow'}, createdAt: 0};
    const c = compute(p);
    const b = buildBrief(p, buildRoute(c, lib), new Date(2026, 10, 24));
    expect(b.cards.map((x) => x.n)).toEqual([2, 6, 2, 5, 5]);
    expect(b.cards.map((x) => x.title)[3]).toBe('Как тебя считывают люди');
  });
});

describe('краткий разбор на 600 случайных людях', () => {
  const r = rnd(11);
  it('человеческим языком и всегда полный', () => {
    for (let i = 0; i < 600; i++) {
      const y = 1940 + Math.floor(r() * 85), m = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 28);
      const known = r() > 0.2;
      const p: Person = {
        id: String(i), name: r() > 0.1 ? 'Ольга Петрова' : '', y, m, d,
        h: known ? Math.floor(r() * 24) : null, min: known ? Math.floor(r() * 60) : null,
        place: {name: 'x', lat: 40 + r() * 30, lon: 20 + r() * 110, tz: 'Europe/Moscow'}, createdAt: 0,
      };
      const b = buildBrief(p, buildRoute(compute(p), lib));
      expect(b.cards.length).toBe(p.name ? 5 : 4);
      expect(b.sheet.length).toBe(3);
      expect(b.doList.length).toBe(5);
      expect(b.dontList.length).toBe(5);
      const texts = [...b.sheet.map((s) => s.text), ...b.doList, ...b.dontList];
      for (const t of texts) expect(isHuman(t), t).toBe(true);
      expect(new Set(texts).size).toBe(texts.length);
      if (p.name) {
        expect(b.conflict).toBeTruthy();
        expect(b.conflict!.text).not.toMatch(/\d|судьб|карм|вселенн|число/i);
      } else expect(b.conflict).toBeNull();
    }
  });
});
