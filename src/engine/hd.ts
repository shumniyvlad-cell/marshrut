// Дизайн человека: активации Личности и Дизайна (88° Солнца до рождения), центры, каналы, тип, авторитет, профиль.
import * as A from 'astronomy-engine';
import {longitude, norm} from './astro';

/** Порядок ворот по мандале, начиная с 2° Водолея (302°). */
export const WHEEL = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];
const START = 302;
const GATE = 360 / 64;
const LINE = GATE / 6;

export type CenterId = 'head' | 'ajna' | 'throat' | 'g' | 'heart' | 'spleen' | 'solar' | 'sacral' | 'root';
export const CENTERS: CenterId[] = ['head', 'ajna', 'throat', 'g', 'heart', 'spleen', 'solar', 'sacral', 'root'];
export const CENTER_RU: Record<CenterId, string> = {
  head: 'Теменной', ajna: 'Аджна', throat: 'Горловой', g: 'G-центр', heart: 'Сердце',
  spleen: 'Селезёнка', solar: 'Солнечное сплетение', sacral: 'Сакральный', root: 'Корневой',
};
const GATE_CENTER: Record<CenterId, number[]> = {
  head: [64, 61, 63],
  ajna: [47, 24, 4, 17, 43, 11],
  throat: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  g: [7, 1, 13, 10, 25, 15, 46, 2],
  heart: [21, 40, 26, 51],
  spleen: [48, 57, 44, 50, 32, 28, 18],
  solar: [36, 22, 37, 6, 49, 55, 30],
  sacral: [5, 14, 29, 59, 9, 3, 42, 27, 34],
  root: [53, 60, 52, 19, 39, 41, 58, 38, 54],
};
export const centerOfGate: Record<number, CenterId> = {};
for (const c of CENTERS) for (const g of GATE_CENTER[c]) centerOfGate[g] = c;

export const CHANNELS: [number, number][] = [
  [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31], [9, 52], [10, 20], [10, 34], [10, 57], [11, 56],
  [12, 22], [13, 33], [16, 48], [17, 62], [18, 58], [19, 49], [20, 34], [20, 57], [21, 45], [23, 43], [24, 61],
  [25, 51], [26, 44], [27, 50], [28, 38], [29, 46], [30, 41], [32, 54], [34, 57], [35, 36], [37, 40], [39, 55],
  [42, 53], [47, 64],
];
const MOTORS: CenterId[] = ['sacral', 'solar', 'heart', 'root'];

export const HD_BODIES = ['sun', 'earth', 'moon', 'nnode', 'snode', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const;
export type HdBody = (typeof HD_BODIES)[number];
export const HD_BODY_RU: Record<HdBody, string> = {
  sun: 'Солнце', earth: 'Земля', moon: 'Луна', nnode: 'Сев. узел', snode: 'Юж. узел', mercury: 'Меркурий',
  venus: 'Венера', mars: 'Марс', jupiter: 'Юпитер', saturn: 'Сатурн', uranus: 'Уран', neptune: 'Нептун', pluto: 'Плутон',
};

export interface Activation {
  body: HdBody;
  lon: number;
  gate: number;
  line: number;
  color: number;
  tone: number;
}

export function gateOf(lon: number) {
  const off = norm(lon - START);
  const idx = Math.floor(off / GATE);
  const inGate = off - idx * GATE;
  const line = Math.floor(inGate / LINE) + 1;
  const inLine = inGate - (line - 1) * LINE;
  const color = Math.floor(inLine / (LINE / 6)) + 1;
  const inColor = inLine - (color - 1) * (LINE / 6);
  const tone = Math.floor(inColor / (LINE / 36)) + 1;
  return {gate: WHEEL[idx], line, color: Math.min(color, 6), tone: Math.min(tone, 6)};
}

function activations(date: Date): Activation[] {
  const sun = longitude('sun', date);
  const node = longitude('node', date);
  const lon: Record<HdBody, number> = {
    sun, earth: norm(sun + 180), moon: longitude('moon', date), nnode: node, snode: norm(node + 180),
    mercury: longitude('mercury', date), venus: longitude('venus', date), mars: longitude('mars', date),
    jupiter: longitude('jupiter', date), saturn: longitude('saturn', date), uranus: longitude('uranus', date),
    neptune: longitude('neptune', date), pluto: longitude('pluto', date),
  };
  return HD_BODIES.map((b) => ({body: b, lon: lon[b], ...gateOf(lon[b])}));
}

/** Момент, когда Солнце было на 88° раньше по долготе. */
export function designDate(birth: Date): Date {
  const target = norm(longitude('sun', birth) - 88);
  const start = new Date(birth.getTime() - 100 * 86400000);
  const t = A.SearchSunLongitude(target, start, 20);
  if (!t) throw new Error('Не нашёл дату Дизайна');
  return t.date;
}

export type HdType = 'generator' | 'mg' | 'manifestor' | 'projector' | 'reflector';
export type Authority = 'emotional' | 'sacral' | 'splenic' | 'ego-manifested' | 'ego-projected' | 'self' | 'mental' | 'lunar';
export type Definition = 'none' | 'single' | 'split' | 'triple' | 'quad';
export type Angle = 'right' | 'juxtaposition' | 'left';

export const TYPE_RU: Record<HdType, string> = {
  generator: 'Генератор', mg: 'Манифестирующий генератор', manifestor: 'Манифестор', projector: 'Проектор', reflector: 'Рефлектор',
};

export interface HdChart {
  designUtc: Date;
  personality: Activation[];
  design: Activation[];
  gates: Map<number, {p: boolean; d: boolean}>;
  channels: string[];
  defined: Set<CenterId>;
  type: HdType;
  authority: Authority;
  profile: string;
  definition: Definition;
  angle: Angle;
  cross: [number, number, number, number];
  /** Генные ключи: ключ сферы → ворота и линия */
  genekeys: Record<string, {gate: number; line: number}>;
}

function components(defined: Set<CenterId>, edges: [CenterId, CenterId][]): CenterId[][] {
  const seen = new Set<CenterId>();
  const out: CenterId[][] = [];
  for (const c of defined) {
    if (seen.has(c)) continue;
    const comp: CenterId[] = [];
    const stack = [c];
    seen.add(c);
    while (stack.length) {
      const x = stack.pop()!;
      comp.push(x);
      for (const [a, b] of edges) {
        const y = a === x ? b : b === x ? a : null;
        if (y && !seen.has(y)) { seen.add(y); stack.push(y); }
      }
    }
    out.push(comp);
  }
  return out;
}

export function hdChart(birthUtc: Date): HdChart {
  const designUtc = designDate(birthUtc);
  const personality = activations(birthUtc);
  const design = activations(designUtc);
  const gates = new Map<number, {p: boolean; d: boolean}>();
  for (const a of personality) gates.set(a.gate, {p: true, d: gates.get(a.gate)?.d ?? false});
  for (const a of design) gates.set(a.gate, {p: gates.get(a.gate)?.p ?? false, d: true});

  const chans = CHANNELS.filter(([a, b]) => gates.has(a) && gates.has(b));
  const edges = chans.map(([a, b]) => [centerOfGate[a], centerOfGate[b]] as [CenterId, CenterId]);
  const defined = new Set<CenterId>(edges.flat());
  const comps = components(defined, edges);
  const compOf = (c: CenterId) => comps.find((x) => x.includes(c));
  const connected = (a: CenterId, b: CenterId) => defined.has(a) && defined.has(b) && compOf(a) === compOf(b);
  const motorToThroat = MOTORS.some((m) => connected(m, 'throat'));

  let type: HdType;
  if (defined.size === 0) type = 'reflector';
  else if (defined.has('sacral')) type = motorToThroat ? 'mg' : 'generator';
  else type = motorToThroat ? 'manifestor' : 'projector';

  let authority: Authority;
  if (type === 'reflector') authority = 'lunar';
  else if (defined.has('solar')) authority = 'emotional';
  else if (defined.has('sacral')) authority = 'sacral';
  else if (defined.has('spleen')) authority = 'splenic';
  else if (defined.has('heart')) authority = connected('heart', 'throat') && type === 'manifestor' ? 'ego-manifested' : 'ego-projected';
  else if (defined.has('g') && connected('g', 'throat')) authority = 'self';
  else authority = 'mental';

  const pSun = personality[0], pEarth = personality[1], dSun = design[0], dEarth = design[1];
  const profile = `${pSun.line}/${dSun.line}`;
  const definition: Definition = (['none', 'single', 'split', 'triple', 'quad'] as Definition[])[Math.min(comps.length, 4)];
  const angle: Angle = profile === '4/1' ? 'juxtaposition' : pSun.line >= 5 ? 'left' : 'right';

  const P = Object.fromEntries(personality.map((a) => [a.body, a])) as Record<HdBody, Activation>;
  const D = Object.fromEntries(design.map((a) => [a.body, a])) as Record<HdBody, Activation>;
  const gk = (a: Activation) => ({gate: a.gate, line: a.line});
  const genekeys = {
    lifework: gk(P.sun), evolution: gk(P.earth), radiance: gk(D.sun), purpose: gk(D.earth),
    attraction: gk(D.moon), iq: gk(P.venus), eq: gk(P.mars), sq: gk(D.venus),
    vocation: gk(D.mars), culture: gk(D.jupiter), pearl: gk(P.jupiter),
  };

  return {
    designUtc, personality, design, gates,
    channels: chans.map(([a, b]) => `${a}-${b}`),
    defined, type, authority, profile, definition, angle,
    cross: [pSun.gate, pEarth.gate, dSun.gate, dEarth.gate], genekeys,
  };
}
