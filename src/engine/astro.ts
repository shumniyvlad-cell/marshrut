// Западная астрология: положения планет (тропический зодиак, эклиптика даты), дома Плацидуса, аспекты.
import * as A from 'astronomy-engine';

export const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;
export type Sign = (typeof SIGNS)[number];
export const SIGN_RU: Record<Sign, string> = {
  aries: 'Овен', taurus: 'Телец', gemini: 'Близнецы', cancer: 'Рак', leo: 'Лев', virgo: 'Дева',
  libra: 'Весы', scorpio: 'Скорпион', sagittarius: 'Стрелец', capricorn: 'Козерог', aquarius: 'Водолей', pisces: 'Рыбы',
};
// ︎ — просим текстовое начертание, чтобы айфон не рисовал эмодзи.
/** «в Овне», «во Льве» — для подписей. */
export const SIGN_IN: Record<Sign, string> = {
  aries: 'в Овне', taurus: 'в Тельце', gemini: 'в Близнецах', cancer: 'в Раке', leo: 'во Льве', virgo: 'в Деве',
  libra: 'в Весах', scorpio: 'в Скорпионе', sagittarius: 'в Стрельце', capricorn: 'в Козероге', aquarius: 'в Водолее', pisces: 'в Рыбах',
};
export const SIGN_GLYPH: Record<Sign, string> = {
  aries: '♈︎', taurus: '♉︎', gemini: '♊︎', cancer: '♋︎', leo: '♌︎', virgo: '♍︎',
  libra: '♎︎', scorpio: '♏︎', sagittarius: '♐︎', capricorn: '♑︎', aquarius: '♒︎', pisces: '♓︎',
};
export const SIGN_ELEMENT: Record<Sign, 'fire' | 'earth' | 'air' | 'water'> = {
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
};

export const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const;
export type Planet = (typeof PLANETS)[number];
export type Point = Planet | 'node' | 'asc' | 'mc';
export const POINT_RU: Record<Point, string> = {
  sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера', mars: 'Марс',
  jupiter: 'Юпитер', saturn: 'Сатурн', uranus: 'Уран', neptune: 'Нептун', pluto: 'Плутон',
  node: 'Северный узел', asc: 'Асцендент', mc: 'MC',
};
export const POINT_GLYPH: Record<Point, string> = {
  sun: '☉︎', moon: '☽︎', mercury: '☿︎', venus: '♀︎', mars: '♂︎',
  jupiter: '♃︎', saturn: '♄︎', uranus: '♅︎', neptune: '♆︎', pluto: '♇︎',
  node: '☊︎', asc: 'Asc', mc: 'MC',
};

const BODY: Record<Exclude<Planet, 'sun' | 'moon'>, A.Body> = {
  mercury: A.Body.Mercury, venus: A.Body.Venus, mars: A.Body.Mars, jupiter: A.Body.Jupiter,
  saturn: A.Body.Saturn, uranus: A.Body.Uranus, neptune: A.Body.Neptune, pluto: A.Body.Pluto,
};

export const norm = (d: number) => ((d % 360) + 360) % 360;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Эклиптическая долгота (истинная эклиптика даты) для планеты, Солнца, Луны или истинного узла. */
export function longitude(p: Planet | 'node', date: Date): number {
  if (p === 'sun') return norm(A.SunPosition(date).elon);
  if (p === 'moon') return norm(A.EclipticGeoMoon(date).lon);
  if (p === 'node') return trueNode(date);
  return norm(A.Ecliptic(A.GeoVector(BODY[p], date, true)).elon);
}

/** Истинный (оскулирующий) восходящий узел Луны: из вектора состояния Луны в эклиптике даты. */
export function trueNode(date: Date): number {
  const s = A.GeoMoonState(date);
  const rot = A.Rotation_EQJ_ECT(date);
  const t = A.MakeTime(date);
  const r = A.RotateVector(rot, new A.Vector(s.x, s.y, s.z, t));
  const v = A.RotateVector(rot, new A.Vector(s.vx, s.vy, s.vz, t));
  const hx = r.y * v.z - r.z * v.y;
  const hy = r.z * v.x - r.x * v.z;
  return norm(deg(Math.atan2(hx, -hy)));
}

export const signOf = (lon: number): Sign => SIGNS[Math.floor(norm(lon) / 30)];
export const degInSign = (lon: number) => norm(lon) % 30;
export function fmtDeg(lon: number): string {
  const d = degInSign(lon);
  let whole = Math.floor(d);
  let min = Math.round((d - whole) * 60);
  if (min === 60) { whole += 1; min = 0; }
  return `${whole}°${String(min).padStart(2, '0')}′`;
}

export interface Placement {
  id: Point;
  lon: number;
  sign: Sign;
  house: number | null;
  retro: boolean;
}

export interface Aspect {
  a: Planet;
  b: Planet;
  type: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  orb: number;
}

export interface NatalChart {
  placements: Placement[];
  cusps: number[] | null; // 12 куспидов, null если время неизвестно
  houseSystem: 'placidus' | 'porphyry' | null;
  aspects: Aspect[];
  elements: Record<'fire' | 'earth' | 'air' | 'water', number>;
}

const ASPECTS: {type: Aspect['type']; angle: number; orb: number}[] = [
  {type: 'conjunction', angle: 0, orb: 8},
  {type: 'sextile', angle: 60, orb: 5},
  {type: 'square', angle: 90, orb: 7},
  {type: 'trine', angle: 120, orb: 7},
  {type: 'opposition', angle: 180, orb: 8},
];

export function obliquity(date: Date) {
  return A.e_tilt(A.MakeTime(date)).tobl;
}

/** Асцендент и MC по звёздному времени. */
export function angles(date: Date, lat: number, lon: number) {
  const eps = rad(obliquity(date));
  const ramc = rad(norm(A.SiderealTime(date) * 15 + lon));
  const mc = norm(deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps))));
  const asc = norm(deg(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(rad(lat)) * Math.sin(eps)))));
  return {asc, mc, ramc: deg(ramc), eps: deg(eps)};
}

/** Куспиды Плацидуса; за полярным кругом — Порфирий. */
export function houses(date: Date, lat: number, lon: number): {cusps: number[]; system: 'placidus' | 'porphyry'} {
  const {asc, mc, ramc, eps} = angles(date, lat, lon);
  const e = rad(eps);
  const phi = rad(lat);
  const fromRa = (ra: number) => norm(deg(Math.atan2(Math.sin(rad(ra)), Math.cos(rad(ra)) * Math.cos(e))));
  const cusp = (f: number, above: boolean): number | null => {
    let lam = fromRa(ramc + (above ? 90 * f : 180 - 90 * f));
    for (let i = 0; i < 30; i++) {
      const dec = Math.asin(Math.sin(e) * Math.sin(rad(lam)));
      const x = Math.tan(phi) * Math.tan(dec);
      if (Math.abs(x) >= 1) return null;
      const ad = deg(Math.asin(x));
      const ra = above ? ramc + f * (90 + ad) : ramc + 180 - f * (90 - ad);
      const next = fromRa(ra);
      if (Math.abs(norm(next - lam + 180) - 180) < 1e-7) { lam = next; break; }
      lam = next;
    }
    return lam;
  };
  const c11 = cusp(1 / 3, true), c12 = cusp(2 / 3, true), c2 = cusp(2 / 3, false), c3 = cusp(1 / 3, false);
  if (Math.abs(lat) < 66 && c11 !== null && c12 !== null && c2 !== null && c3 !== null) {
    const c = [asc, c2, c3, norm(mc + 180), norm(c11 + 180), norm(c12 + 180), norm(asc + 180), norm(c2 + 180), norm(c3 + 180), mc, c11, c12];
    return {cusps: c, system: 'placidus'};
  }
  // Порфирий: делим квадранты на три равные части
  const ic = norm(mc + 180);
  const q1 = norm(ic - asc) / 3; // от Asc до IC
  const q2 = norm(asc - mc) / 3; // от MC до Asc
  const c = [asc, norm(asc + q1), norm(asc + 2 * q1), ic, norm(ic + q2), norm(ic + 2 * q2),
    norm(asc + 180), norm(asc + 180 + q1), norm(asc + 180 + 2 * q1), mc, norm(mc + q2), norm(mc + 2 * q2)];
  return {cusps: c, system: 'porphyry'};
}

export function houseOf(lon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i], b = cusps[(i + 1) % 12];
    const span = norm(b - a);
    if (norm(lon - a) < span) return i + 1;
  }
  return 12;
}

export function natalChart(utc: Date, lat: number | null, lon: number | null, timeKnown: boolean): NatalChart {
  const h = timeKnown && lat !== null && lon !== null ? houses(utc, lat, lon) : null;
  const day = new Date(utc.getTime() + 86400000);
  const list: (Planet | 'node')[] = [...PLANETS, 'node'];
  const placements: Placement[] = list.map((p) => {
    const l = longitude(p, utc);
    const next = p === 'node' ? l : longitude(p, day);
    return {
      id: p, lon: l, sign: signOf(l),
      house: h ? houseOf(l, h.cusps) : null,
      retro: p !== 'sun' && p !== 'moon' && p !== 'node' && norm(next - l + 180) - 180 < 0,
    };
  });
  if (h && lat !== null && lon !== null) {
    const {asc, mc} = angles(utc, lat, lon);
    placements.push({id: 'asc', lon: asc, sign: signOf(asc), house: 1, retro: false});
    placements.push({id: 'mc', lon: mc, sign: signOf(mc), house: 10, retro: false});
  }
  const aspects: Aspect[] = [];
  const pl = placements.filter((p) => (PLANETS as readonly string[]).includes(p.id));
  for (let i = 0; i < pl.length; i++) {
    for (let j = i + 1; j < pl.length; j++) {
      // без точного времени Луна может уехать на 6°, поэтому её аспекты не считаем
      if (!timeKnown && (pl[i].id === 'moon' || pl[j].id === 'moon')) continue;
      const d = Math.abs(norm(pl[i].lon - pl[j].lon + 180) - 180);
      for (const asp of ASPECTS) {
        const lum = pl[i].id === 'sun' || pl[i].id === 'moon' || pl[j].id === 'sun' || pl[j].id === 'moon';
        const orb = Math.abs(d - asp.angle);
        if (orb <= asp.orb + (lum ? 2 : 0)) {
          aspects.push({a: pl[i].id as Planet, b: pl[j].id as Planet, type: asp.type, orb});
          break;
        }
      }
    }
  }
  aspects.sort((x, y) => x.orb - y.orb);
  const elements = {fire: 0, earth: 0, air: 0, water: 0};
  const weight: Partial<Record<Point, number>> = {sun: 3, moon: 3, asc: 2, mercury: 1, venus: 1, mars: 1, jupiter: 1, saturn: 1};
  for (const p of placements) elements[SIGN_ELEMENT[p.sign]] += weight[p.id] ?? 0;
  return {placements, cusps: h?.cusps ?? null, houseSystem: h?.system ?? null, aspects, elements};
}
