// Маршрут: из всех систем собираем, что делать, что не делать и какой сценарий повторяется.
import type {Calc} from './index';
import type {Library} from '../content';
import {SIGNS, SIGN_IN, norm, signOf} from './astro';
import {CENTERS, CENTER_RU, TYPE_RU} from './hd';
import {ELEMENT_RU} from './bazi';

export type Sphere = 'decisions' | 'energy' | 'work' | 'love' | 'growth';
export const SPHERE_RU: Record<Sphere, string> = {
  decisions: 'Решения', energy: 'Энергия и тело', work: 'Дело и деньги', love: 'Отношения', growth: 'Рост',
};

export interface Item { text: string; source: string; sphere: Sphere; weight: number }
export interface Scenario { title: string; repeat: string; exit: string; source: string }
export interface Step { title: string; days: string; why: string; actions: string[] }

export interface Route {
  title: string;      // «Проектор 6/2»
  subtitle: string;   // авторитет
  strategy: string;   // стратегия типа
  rule: string;       // правило решения
  signature: string;
  notself: string;
  doTop: Item[];
  dontTop: Item[];
  doAll: Record<Sphere, Item[]>;
  dontAll: Record<Sphere, Item[]>;
  scenarios: Scenario[];
  steps: Step[];
  daily: string[];
  yearFocus: {title: string; short: string};
}

export const AUTH_RU: Record<string, string> = {
  emotional: 'Эмоциональный авторитет',
  sacral: 'Сакральный авторитет',
  splenic: 'Селезёночный авторитет',
  'ego-manifested': 'Эго-манифестированный авторитет',
  'ego-projected': 'Эго-проецированный авторитет',
  self: 'Самопроецированный авторитет',
  mental: 'Ментальный авторитет',
  lunar: 'Лунный авторитет',
};
export const AUTH_RULE: Record<string, string> = {
  emotional: 'Решать после волны: ночь сна, потом ответ',
  sacral: 'Отвечать телом: «угу» или «неа» за секунду',
  splenic: 'Верить первому тихому сигналу, он не повторится',
  'ego-manifested': 'Обещать только то, чего хочется по-настоящему',
  'ego-projected': 'Слушать, что говорите вслух о своём желании',
  self: 'Проговорить вслух и услышать, где звучит правда',
  mental: 'Обсудить с двумя людьми, которым доверяете, и решить в своём месте',
  lunar: 'Давать большому решению 28 дней',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const key = (s: string) => s.toLowerCase().replace(/[^а-яёa-z ]/g, '').split(' ').filter((w) => w.length > 2).slice(0, 3).join(' ');

export function buildRoute(c: Calc, lib: Library): Route {
  const doItems: Item[] = [];
  const dontItems: Item[] = [];
  const add = (src: {do?: string[]; dont?: string[]} | undefined, source: string, sphere: Sphere, weight: number) => {
    if (!src) return;
    src.do?.forEach((t, i) => doItems.push({text: t, source, sphere, weight: weight - i * 0.5}));
    src.dont?.forEach((t, i) => dontItems.push({text: t, source, sphere, weight: weight - i * 0.5}));
  };
  const pl = (id: string) => c.natal.placements.find((p) => p.id === id);
  const sign = (id: string) => {
    const p = pl(id);
    return p ? lib.signs[id]?.[p.sign] : undefined;
  };

  const type = lib.hd.types[c.hd.type];
  const auth = lib.hd.authorities[c.hd.authority];
  const prof = lib.hd.profiles[c.hd.profile];
  add(type, `Дизайн человека: ${TYPE_RU[c.hd.type]}`, 'decisions', 10);
  add(auth, `Дизайн человека: ${AUTH_RU[c.hd.authority].toLowerCase()}`, 'decisions', 10);
  add(prof, `Дизайн человека: профиль ${c.hd.profile}`, 'growth', 6);
  for (const ch of c.hd.channels.slice(0, 3)) add(lib.hd.channels[ch], `Дизайн человека: канал ${ch}`, 'work', 3);
  for (const cid of CENTERS) {
    if (c.hd.defined.has(cid)) continue;
    const ce = lib.hd.centers[cid];
    if (ce) dontItems.push(...ce.open.dont.slice(0, 1).map((t) => ({text: t, source: `Дизайн человека: открытый центр «${CENTER_RU[cid]}»`, sphere: 'energy' as Sphere, weight: 4.5})));
  }

  const mx = (n: number) => lib.matrix[String(n)];
  const A = mx(c.matrix.A), tail = mx(c.matrix.tail[0]);
  add(A?.personality, `Матрица судьбы: аркан личности ${c.matrix.A}`, 'growth', 7);
  add(mx(c.matrix.money)?.money, `Матрица судьбы: денежный канал, аркан ${c.matrix.money}`, 'work', 5);
  add(mx(c.matrix.love)?.love, `Матрица судьбы: канал отношений, аркан ${c.matrix.love}`, 'love', 5);
  if (tail) doItems.push({text: cap(tail.tail.exit), source: `Матрица судьбы: кармический хвост ${c.matrix.tail.join('-')}`, sphere: 'growth', weight: 8});

  add(lib.numbers.lifepath[String(c.lifePath)], `Нумерология: число пути ${c.lifePath}`, 'work', 6);
  const py = lib.numbers.personalYear[String(c.personalYear)];
  add(py, `Нумерология: личный год ${c.personalYear}`, 'growth', 5);

  add(sign('sun'), `Астрология: Солнце ${SIGN_IN[pl('sun')!.sign]}`, 'work', 6);
  if (c.timeKnown) add(sign('moon'), `Астрология: Луна ${SIGN_IN[pl('moon')!.sign]}`, 'energy', 5);
  add(sign('venus'), `Астрология: Венера ${SIGN_IN[pl('venus')!.sign]}`, 'love', 4.5);
  add(sign('mars'), `Астрология: Марс ${SIGN_IN[pl('mars')!.sign]}`, 'energy', 4);
  add(sign('saturn'), `Астрология: Сатурн ${SIGN_IN[pl('saturn')!.sign]}`, 'work', 4);
  add(sign('node'), `Астрология: Северный узел ${SIGN_IN[pl('node')!.sign]}`, 'growth', 5);
  if (c.timeKnown) {
    add(sign('asc'), `Астрология: Асцендент ${SIGN_IN[pl('asc')!.sign]}`, 'growth', 4);
    add(sign('mc'), `Астрология: MC ${SIGN_IN[pl('mc')!.sign]}`, 'work', 4);
  }

  const dm = lib.east.stems[c.bazi.dayMaster];
  add(dm, 'Ба Цзы: хозяин дня', 'energy', 5);
  for (const e of c.bazi.lack) add(lib.east.elements[e]?.lack, `Ба Цзы: не хватает стихии ${ELEMENT_RU[e]}`, 'energy', 4.5);
  for (const e of c.bazi.excess) add(lib.east.elements[e]?.excess, `Ба Цзы: избыток стихии ${ELEMENT_RU[e]}`, 'energy', 4);

  const pick = (items: Item[], n: number) => {
    const seen = new Set<string>();
    const perSys = new Map<string, number>();
    const out: Item[] = [];
    for (const it of [...items].sort((a, b) => b.weight - a.weight)) {
      const k = key(it.text);
      if (seen.has(k)) continue;
      const sys = it.source.split(':')[0];
      if ((perSys.get(sys) ?? 0) >= Math.ceil(n / 2.5)) continue;
      seen.add(k);
      perSys.set(sys, (perSys.get(sys) ?? 0) + 1);
      out.push(it);
      if (out.length >= n) break;
    }
    return out;
  };
  const bySphere = (items: Item[]) => {
    const r = {} as Record<Sphere, Item[]>;
    for (const s of Object.keys(SPHERE_RU) as Sphere[]) {
      const seen = new Set<string>();
      r[s] = items.filter((i) => i.sphere === s).sort((a, b) => b.weight - a.weight)
        .filter((i) => { const k = key(i.text); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
    }
    return r;
  };

  const scenarios: Scenario[] = [];
  if (tail) scenarios.push({title: tail.tail.title, repeat: cap(tail.tail.scenario), exit: cap(tail.tail.exit), source: `Матрица судьбы, кармический хвост ${c.matrix.tail.join('-')}`});
  scenarios.push({
    title: `Сигнал «${type.notself.toLowerCase()}»`,
    repeat: `${type.notself} появляется, когда решение принято в обход своей системы: из головы, из чужих ожиданий, на бегу`,
    exit: `${type.strategy}. ${AUTH_RULE[c.hd.authority]}`,
    source: `Дизайн человека, ${TYPE_RU[c.hd.type].toLowerCase()}`,
  });
  const node = pl('node');
  if (node) {
    const south = signOf(norm(node.lon + 180));
    const n = lib.signs.node?.[node.sign];
    if (n) scenarios.push({
      title: `Южный узел ${SIGN_IN[south]}`,
      repeat: `Тянет назад в привычное: ${n.dont[0]?.toLowerCase() ?? 'старые роли'}`,
      exit: `Расти в сторону Северного узла ${SIGN_IN[node.sign]}: ${n.do[0]?.toLowerCase() ?? n.short}`,
      source: 'Астрология, лунные узлы',
    });
  }

  const moon = sign('moon');
  const daily = [
    AUTH_RULE[c.hd.authority],
    ...(c.timeKnown && moon ? [moon.do[0]] : []),
    dm?.do[0],
    type.do[0],
  ].filter(Boolean) as string[];

  const doS = bySphere(doItems), dontS = bySphere(dontItems);
  const steps: Step[] = [
    {
      days: 'Дни 1–30', title: 'Решения по своей системе',
      why: `${type.strategy}. ${AUTH_RULE[c.hd.authority]}.`,
      actions: [...doS.decisions.slice(0, 3).map((i) => i.text), dontS.decisions[0] ? `Отказаться от привычки: ${dontS.decisions[0].text.toLowerCase()}` : ''].filter(Boolean),
    },
    {
      days: 'Дни 31–60', title: 'Энергия и восстановление',
      why: c.bazi.lack.length ? `В Ба Цзы не хватает стихии ${c.bazi.lack.map((e) => ELEMENT_RU[e]).join(' и ')}, её добираем образом жизни.` : `Хозяин дня ${dm?.image ?? ''}: силы держатся на ритме.`,
      actions: [...doS.energy.slice(0, 3).map((i) => i.text), dontS.energy[0] ? `Убрать: ${dontS.energy[0].text.toLowerCase()}` : ''].filter(Boolean),
    },
    {
      days: 'Дни 61–90', title: 'Дело и деньги',
      why: `Число пути ${c.lifePath}, денежный канал Матрицы ${c.matrix.money}${c.timeKnown && pl('mc') ? `, MC ${SIGN_IN[pl('mc')!.sign]}` : ''}.`,
      actions: [...doS.work.slice(0, 3).map((i) => i.text), ...doS.love.slice(0, 1).map((i) => i.text)],
    },
  ];

  return {
    title: `${TYPE_RU[c.hd.type]} ${c.hd.profile}`,
    subtitle: AUTH_RU[c.hd.authority],
    strategy: type.strategy,
    rule: AUTH_RULE[c.hd.authority],
    signature: type.signature,
    notself: type.notself,
    doTop: pick(doItems, 8),
    dontTop: pick(dontItems, 7),
    doAll: doS,
    dontAll: dontS,
    scenarios,
    steps,
    daily: [...new Set(daily)].slice(0, 4),
    yearFocus: {title: `${c.year}: личный год ${c.personalYear}`, short: py?.short ?? ''},
  };
}

export {SIGNS};
