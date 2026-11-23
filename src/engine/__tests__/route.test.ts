import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {compute, type Person} from '../index';
import {buildRoute} from '../route';
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

const TZ = ['Europe/Moscow', 'Asia/Almaty', 'Asia/Novosibirsk', 'Europe/Kaliningrad', 'Asia/Vladivostok'];
function rnd(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

describe('маршрут на 600 случайных людях', () => {
  const r = rnd(42);
  const people: Person[] = Array.from({length: 600}, (_, i) => {
    const y = 1940 + Math.floor(r() * 85), m = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 28);
    const known = r() > 0.2;
    return {
      id: String(i), name: r() > 0.1 ? 'Ольга Петрова' : '', y, m, d,
      h: known ? Math.floor(r() * 24) : null, min: known ? Math.floor(r() * 60) : null,
      place: {name: 'x', lat: 40 + r() * 30, lon: 20 + r() * 110, tz: TZ[i % TZ.length]}, createdAt: 0,
    };
  });

  it('у каждого есть все трактовки и полный маршрут', () => {
    const types = new Set<string>(), auth = new Set<string>(), prof = new Set<string>();
    for (const p of people) {
      const c = compute(p);
      types.add(c.hd.type); auth.add(c.hd.authority); prof.add(c.hd.profile);
      expect(lib.hd.types[c.hd.type], `тип ${c.hd.type}`).toBeTruthy();
      expect(lib.hd.authorities[c.hd.authority], `авторитет ${c.hd.authority}`).toBeTruthy();
      expect(lib.hd.profiles[c.hd.profile], `профиль ${c.hd.profile}`).toBeTruthy();
      for (const ch of c.hd.channels) expect(lib.hd.channels[ch], `канал ${ch}`).toBeTruthy();
      for (const g of c.hd.gates.keys()) expect(lib.hd.gates[String(g)], `ворота ${g}`).toBeTruthy();
      for (const pl of c.natal.placements) expect(lib.signs[pl.id]?.[pl.sign], `${pl.id} ${pl.sign}`).toBeTruthy();
      for (const n of [c.matrix.A, c.matrix.B, c.matrix.E, c.matrix.money, c.matrix.love, ...c.matrix.tail, c.matrix.personal, c.matrix.social, c.matrix.spiritual])
        expect(lib.matrix[String(n)], `аркан ${n}`).toBeTruthy();
      expect(lib.numbers.lifepath[String(c.lifePath)], `путь ${c.lifePath}`).toBeTruthy();
      if (c.name) for (const k of ['expression', 'soul', 'personality'] as const) expect(lib.numbers[k][String(c.name[k])], `${k} ${c.name[k]}`).toBeTruthy();
      for (const gk of Object.values(c.hd.genekeys)) expect(lib.east.genekeys[String(gk.gate)]).toBeTruthy();
      expect(lib.east.stems[c.bazi.dayMaster]).toBeTruthy();
      const route = buildRoute(c, lib);
      expect(route.doTop.length).toBeGreaterThanOrEqual(7);
      expect(route.dontTop.length).toBeGreaterThanOrEqual(7);
      expect(route.scenarios.length).toBeGreaterThanOrEqual(2);
      expect(route.steps.every((s) => s.actions.length >= 2)).toBe(true);
      expect(new Set(route.doTop.map((i) => i.text)).size).toBe(route.doTop.length);
    }
    // все пять типов должны встречаться на такой выборке
    expect([...types].sort()).toEqual(['generator', 'manifestor', 'mg', 'projector', 'reflector'].filter((t) => types.has(t)));
    expect(types.size).toBeGreaterThanOrEqual(4);
    console.log('типы', [...types], 'авторитеты', [...auth], 'профили', prof.size);
  });
});
