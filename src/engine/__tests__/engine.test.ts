import {describe, expect, it} from 'vitest';
import {natalChart, signOf, degInSign, POINT_RU} from '../astro';
import {localToUtc} from '../time';
import {hdChart, gateOf} from '../hd';
import {destinyMatrix, pythagoras, lifePath, nameNumbers, reduce22} from '../numbers';
import {bazi} from '../bazi';

const lonOf = (c: ReturnType<typeof natalChart>, id: string) => c.placements.find((p) => p.id === id)!.lon;
const near = (lon: number, sign: string, deg: number, tol = 0.2) => {
  expect(signOf(lon)).toBe(sign);
  expect(Math.abs(degInSign(lon) - deg)).toBeLessThan(tol);
};

describe('время', () => {
  it('Гонолулу 1961 = UTC−10', () => {
    const {utc} = localToUtc(1961, 8, 4, 19, 24, 'Pacific/Honolulu');
    expect(utc.toISOString()).toBe('1961-08-05T05:24:00.000Z');
  });
  it('Москва летом 1985 = UTC+4 (летнее время)', () => {
    expect(localToUtc(1985, 7, 1, 12, 0, 'Europe/Moscow').offset).toBe(240);
    expect(localToUtc(2015, 7, 1, 12, 0, 'Europe/Moscow').offset).toBe(180);
  });
});

describe('натальная карта: Барак Обама, 04.08.1961 19:24, Гонолулу', () => {
  const {utc} = localToUtc(1961, 8, 4, 19, 24, 'Pacific/Honolulu');
  const c = natalChart(utc, 21.3069, -157.8583, true);
  it('Солнце 12°33 Льва', () => near(lonOf(c, 'sun'), 'leo', 12.55));
  it('Луна 3°21 Близнецов', () => near(lonOf(c, 'moon'), 'gemini', 3.35, 0.3));
  it('Венера 1°47 Рака', () => near(lonOf(c, 'venus'), 'cancer', 1.78));
  it('Марс 22°35 Девы', () => near(lonOf(c, 'mars'), 'virgo', 22.58));
  it('Сатурн ретро в Козероге', () => {
    expect(signOf(lonOf(c, 'saturn'))).toBe('capricorn');
    expect(c.placements.find((p) => p.id === 'saturn')!.retro).toBe(true);
  });
  it('Асцендент ~18° Водолея', () => near(lonOf(c, 'asc'), 'aquarius', 18.05, 0.5));
  it('MC ~28° Скорпиона', () => near(lonOf(c, 'mc'), 'scorpio', 28.9, 0.6));
  it('Луна в 4 доме', () => expect(c.placements.find((p) => p.id === 'moon')!.house).toBe(4));
  it('куспиды идут по кругу', () => {
    expect(c.cusps).toHaveLength(12);
    for (let i = 0; i < 12; i++) {
      const span = ((c.cusps![(i + 1) % 12] - c.cusps![i]) % 360 + 360) % 360;
      expect(span).toBeGreaterThan(10);
      expect(span).toBeLessThan(60);
    }
  });
  it('печать', () => {
    console.log(c.placements.map((p) => `${POINT_RU[p.id]} ${p.sign} ${degInSign(p.lon).toFixed(2)} д${p.house}`).join('\n'));
  });
});

describe('Дизайн человека', () => {
  it('мандала: 302° = ворота 41.1, 358.25° = ворота 25.1, Скорпион 13°15 = ворота 1', () => {
    expect(gateOf(302.01)).toMatchObject({gate: 41, line: 1});
    expect(gateOf(358.26)).toMatchObject({gate: 25, line: 1});
    expect(gateOf(223.26).gate).toBe(1);
    expect(gateOf(301.99)).toMatchObject({gate: 60, line: 6});
  });
  it('Солнце Дизайна на 88° раньше', () => {
    const {utc} = localToUtc(1961, 8, 4, 19, 24, 'Pacific/Honolulu');
    const h = hdChart(utc);
    const p = h.personality[0].lon, d = h.design[0].lon;
    expect(Math.abs((((p - d) % 360) + 360) % 360 - 88)).toBeLessThan(0.001);
    const days = (utc.getTime() - h.designUtc.getTime()) / 86400000;
    expect(days).toBeGreaterThan(84);
    expect(days).toBeLessThan(93);
    console.log('Обама HD', h.type, h.authority, h.profile, h.definition, h.channels, h.cross);
  });
  it('Ра Уру Ху 09.04.1948 00:14 Монреаль: Манифестор 5/1', () => {
    const {utc} = localToUtc(1948, 4, 9, 0, 14, 'America/Toronto');
    const h = hdChart(utc);
    console.log('Ра', h.type, h.authority, h.profile, h.channels, h.cross);
    expect(h.type).toBe('manifestor');
    expect(h.profile).toBe('5/1');
  });
});

describe('числа', () => {
  it('аркан 22 и сведение', () => {
    expect(reduce22(31)).toBe(4);
    expect(reduce22(22)).toBe(22);
    expect(reduce22(45)).toBe(9);
  });
  it('Матрица 12.05.1990', () => {
    const m = destinyMatrix({y: 1990, m: 5, d: 12});
    expect([m.A, m.B, m.C, m.D, m.E]).toEqual([12, 5, 19, 9, 9]);
  });
  it('Пифагор 12.05.1990: 27, 9, 25, 7', () => {
    expect(pythagoras({y: 1990, m: 5, d: 12}).working).toEqual([27, 9, 25, 7]);
  });
  it('Пифагор после 2000: +19', () => {
    expect(pythagoras({y: 2003, m: 3, d: 15}).working).toEqual([14, 5, 33, 6]);
  });
  it('число пути', () => {
    expect(lifePath({y: 1990, m: 5, d: 12})).toBe(9);
    expect(lifePath({y: 1983, m: 11, d: 29})).toBe(7);
  });
  it('имя', () => expect(nameNumbers('Анна')).toMatchObject({expression: 5}));
});

describe('Ба Цзы', () => {
  it('01.01.2000 — день У У (戊午), год Цзи Мао 1999 (до Ли Чунь)', () => {
    const {utc} = localToUtc(2000, 1, 1, 12, 0, 'Asia/Shanghai');
    const b = bazi(utc, {y: 2000, m: 1, d: 1, h: 12});
    expect(b.day).toEqual({stem: 4, branch: 6});
    expect(b.year).toEqual({stem: 5, branch: 3});
    expect(b.animal).toBe('rabbit');
  });
  it('10.02.1984 — год Цзя Цзы (Крыса)', () => {
    const {utc} = localToUtc(1984, 2, 10, 12, 0, 'Asia/Shanghai');
    const b = bazi(utc, {y: 1984, m: 2, d: 10, h: 12});
    expect(b.year).toEqual({stem: 0, branch: 0});
    expect(b.month.branch).toBe(2);
    expect(b.month.stem).toBe(2); // Бин Инь
  });
});

import {forecast, lunarReturns} from '../forecast';
import {compute} from '../index';
import {longitude} from '../astro';
describe('даты', () => {
  const p = {id: 'x', name: 'Анна', y: 1990, m: 5, d: 12, h: 8, min: 40, place: {name: 'Вологда', lat: 59.22, lon: 39.88, tz: 'Europe/Moscow'}, createdAt: 0};
  const c = compute(p, new Date('2026-11-23T12:00:00Z'));
  const f = forecast(c, {gateTitle: (g) => `в${g}`, channelTitle: (k) => `к${k}`}, new Date('2026-11-23T09:00:00Z'), 92);
  it('92 дня и события', () => {
    expect(f.days).toHaveLength(92);
    expect(f.events.length).toBeGreaterThan(10);
  });
  it('лунный цикл ~27,3 дня, Луна точно на натальном месте', () => {
    const moon = c.natal.placements.find((x) => x.id === 'moon')!.lon;
    const r = lunarReturns(moon, Date.parse('2026-11-01'), Date.parse('2027-02-01'));
    expect(r.length).toBe(3);
    const gap = (r[1].getTime() - r[0].getTime()) / 86400000;
    expect(gap).toBeGreaterThan(27); expect(gap).toBeLessThan(27.7);
    expect(Math.abs(((longitude('moon', r[0]) - moon + 540) % 360) - 180)).toBeLessThan(0.01);
  });
  it('новолуние 20.11.2026 и 9.12.2026', () => {
    const nm = f.events.filter((e) => e.kind === 'newmoon').map((e) => e.date.toISOString().slice(0, 10));
    expect(nm[0]).toBe('2026-12-09');
    console.log(f.events.map((e) => `${e.date.toISOString().slice(0, 10)} ${e.title}`).join('\n'));
  });
});
