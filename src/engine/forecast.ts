// Даты на неделю, месяц и три месяца: Луна, лунный цикл человека, ретроградные планеты, затмения,
// Солнце в его воротах и каналах, транзиты медленных планет, личные дни и столп дня.
import * as A from 'astronomy-engine';
import type {Calc} from './index';
import {longitude, norm, signOf, houseOf, SIGN_IN, type Sign, type Planet} from './astro';
import {gateOf, CHANNELS} from './hd';
import {digitSum, reduce9} from './numbers';
import {stemElement, type Element} from './bazi';

export const DAY = 86400000;
const diff = (a: number, b: number) => norm(a - b + 180) - 180;

export type Tone = 'good' | 'care' | 'neutral';
export type EvKind =
  | 'newmoon' | 'fullmoon' | 'quarter' | 'lunar-return' | 'retro' | 'direct' | 'eclipse'
  | 'sun-gate' | 'sun-channel' | 'sun-sign' | 'transit' | 'birthday' | 'pmonth';

export interface Ev { date: Date; end?: Date; kind: EvKind; title: string; text: string; tone: Tone }

export type Relation = 'friend' | 'resource' | 'output' | 'wealth' | 'power';
export interface Day {
  date: Date;
  moonSign: Sign;
  moonHouse: number | null;
  moonGate: number;
  moonGateMine: boolean;
  moonChannel: string | null;
  phase: number; // угол фазы 0–360
  light: number; // освещённость 0–1
  personalDay: number;
  relation: Relation;
  pillar: {stem: number; branch: number};
  events: Ev[];
}

export const PDAY: Record<number, {title: string; hint: string}> = {
  1: {title: 'Начинать', hint: 'запускать новое, писать первым, брать инициативу'},
  2: {title: 'Договариваться', hint: 'встречи, партнёры, мягкие переговоры'},
  3: {title: 'Говорить', hint: 'публикации, эфиры, знакомства'},
  4: {title: 'Порядок', hint: 'документы, рутина, тело и сон'},
  5: {title: 'Перемены', hint: 'поездки, новое окружение, гибкий план'},
  6: {title: 'Забота', hint: 'дом, семья, клиенты, красота'},
  7: {title: 'Тишина', hint: 'анализ, учёба, время наедине с собой'},
  8: {title: 'Деньги', hint: 'продажи, переговоры о цене, решения по деньгам'},
  9: {title: 'Завершать', hint: 'закрывать хвосты, отпускать, подводить итоги'},
};
export const PMONTH: Record<number, string> = {
  1: 'месяц старта: закладывать новое',
  2: 'месяц терпения и союзов',
  3: 'месяц видимости и общения',
  4: 'месяц порядка и работы руками',
  5: 'месяц перемен и движения',
  6: 'месяц семьи и ответственности',
  7: 'месяц тишины, учёбы и анализа',
  8: 'месяц денег и результата',
  9: 'месяц завершений',
};
export const RELATION: Record<Relation, {title: string; hint: string; tone: Tone}> = {
  friend: {title: 'Опора на себя', hint: 'хорошо работать самостоятельно, не соревноваться', tone: 'neutral'},
  resource: {title: 'Подпитка', hint: 'учиться, отдыхать, просить помощи', tone: 'good'},
  output: {title: 'Отдача', hint: 'творить, выступать, показывать работу', tone: 'good'},
  wealth: {title: 'Результат', hint: 'сделки, деньги, доводить до конца', tone: 'good'},
  power: {title: 'Давление', hint: 'не спорить с теми, кто выше, не брать лишнего', tone: 'care'},
};

const GEN: Record<Element, Element> = {wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood'};
const CTRL: Record<Element, Element> = {wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood'};
export function relation(dm: Element, day: Element): Relation {
  if (dm === day) return 'friend';
  if (GEN[day] === dm) return 'resource';
  if (GEN[dm] === day) return 'output';
  if (CTRL[dm] === day) return 'wealth';
  return 'power';
}

function jdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function bisect(f: (t: number) => number, a: number, b: number, iter = 30) {
  let fa = f(a);
  for (let i = 0; i < iter; i++) {
    const m = (a + b) / 2, fm = f(m);
    if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else b = m;
  }
  return new Date((a + b) / 2);
}

/** Моменты, когда Луна возвращается на натальное место: начало личного лунного цикла. */
export function lunarReturns(moonLon: number, from: number, to: number): Date[] {
  const f = (t: number) => diff(longitude('moon', new Date(t)), moonLon);
  const out: Date[] = [];
  let prev = f(from);
  for (let t = from + DAY / 4; t <= to; t += DAY / 4) {
    const cur = f(t);
    if (prev < 0 && cur >= 0 && cur - prev < 30) out.push(bisect(f, t - DAY / 4, t));
    prev = cur;
  }
  return out;
}

const RETRO_PL: Exclude<Planet, 'sun' | 'moon'>[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];
const PL_RU: Record<string, string> = {mercury: 'Меркурий', venus: 'Венера', mars: 'Марс', jupiter: 'Юпитер', saturn: 'Сатурн', uranus: 'Уран', neptune: 'Нептун', pluto: 'Плутон'};
const RETRO_TEXT: Record<string, string> = {
  mercury: 'Пересматривать, перепроверять, возвращаться к старым контактам. Новые договоры и технику лучше отложить или читать вдвое внимательнее.',
  venus: 'Пересмотр отношений и цен. Возвращаются старые чувства и люди. Не лучшее время для свадьбы, пластики и резкого подъёма цен.',
  mars: 'Энергия уходит внутрь: доделывать начатое, не начинать войн и больших запусков, беречь тело.',
  jupiter: 'Рост идёт вглубь: пересобрать планы, учиться, проверить, во что вы верите.',
  saturn: 'Время навести порядок в обязательствах и сроках: что тянете по инерции, а что пора закрыть.',
};

const TARGET_DAT: Record<string, string> = {sun: 'вашему Солнцу', moon: 'вашей Луне', asc: 'вашему Асценденту', mc: 'вашему MC'};
const TARGET_INS: Record<string, string> = {sun: 'вашим Солнцем', moon: 'вашей Луной', asc: 'вашим Асцендентом', mc: 'вашим MC'};
const TARGET_THEME: Record<string, string> = {sun: 'себя и своего дела', moon: 'дома, семьи и чувств', asc: 'того, как вас видят', mc: 'карьеры и статуса'};
const ASPECTS = [
  {a: 0, ru: 'в соединении с', soft: null},
  {a: 60, ru: 'в секстиле к', soft: true},
  {a: 90, ru: 'в квадрате к', soft: false},
  {a: 120, ru: 'в трине к', soft: true},
  {a: 180, ru: 'в оппозиции к', soft: false},
] as const;
function transitText(p: string, soft: boolean | null, target: string): {text: string; tone: Tone} {
  const th = TARGET_THEME[target];
  if (p === 'jupiter') return soft === false
    ? {text: `Рост через перегиб в теме ${th}: легко пообещать и взять больше, чем унесёте. Расширяться, но со сроками.`, tone: 'neutral'}
    : {text: `Окно роста в теме ${th}. Удачные недели для смелых шагов, знакомств и предложений, которые давно откладывали.`, tone: 'good'};
  if (p === 'saturn') return soft
    ? {text: `То, что строите в теме ${th}, закрепляется. Хорошо брать долгие обязательства и наводить систему.`, tone: 'good'}
    : {text: `Проверка на прочность в теме ${th}. Сокращать лишнее, договариваться письменно, не тянуть на себе чужое.`, tone: 'care'};
  if (p === 'uranus') return {text: `Внезапные перемены в теме ${th}. Оставлять в плане запас и пробовать новое.`, tone: soft ? 'good' : 'care'};
  if (p === 'neptune') return {text: `Туман и вдохновение в теме ${th}. Мечтать можно, подписывать важное только после проверки.`, tone: soft ? 'neutral' : 'care'};
  return {text: `Глубокая перестройка в теме ${th}: уходит то, что отжило. Не держаться за старое силой.`, tone: soft ? 'neutral' : 'care'};
}

const fmtShort = (d: Date) => d.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'});

export interface Forecast { days: Day[]; events: Ev[]; lastReturn: Date | null; nextReturn: Date | null }

export function forecast(c: Calc, lib: {gateTitle: (g: number) => string; channelTitle: (k: string) => string}, start = new Date(), count = 92): Forecast {
  const t0 = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const t1 = t0 + count * DAY;
  const events: Ev[] = [];
  const myGates = c.hd.gates;
  const cusps = c.natal.cusps;
  const natal = (id: string) => c.natal.placements.find((p) => p.id === id)?.lon;
  const houseTxt = (lon: number) => (cusps ? `, ваш ${houseOf(lon, cusps)} дом` : '');

  // Фазы Луны
  let mq = A.SearchMoonQuarter(new Date(t0));
  while (mq.time.date.getTime() < t1) {
    const d = mq.time.date;
    const lon = longitude('moon', d);
    const s = SIGN_IN[signOf(lon)];
    if (mq.quarter === 0) events.push({date: d, kind: 'newmoon', tone: 'good', title: `Новолуние ${s}${houseTxt(lon)}`, text: 'Сажать новое: намерения, планы, первые шаги. Три дня перед новолунием лучше отдать отдыху и разбору.'});
    else if (mq.quarter === 2) events.push({date: d, kind: 'fullmoon', tone: 'neutral', title: `Полнолуние ${s}${houseTxt(lon)}`, text: `Пик эмоций и итогов: видно, что выросло. Подводить итог, благодарить, не принимать резких решений на взводе.`});
    else events.push({date: d, kind: 'quarter', tone: 'neutral', title: mq.quarter === 1 ? `Первая четверть ${s}` : `Последняя четверть ${s}`, text: mq.quarter === 1 ? 'Первое сопротивление плану: дожать или поправить курс.' : 'Убирать лишнее, раздавать долги, готовиться к новому циклу.'});
    mq = A.NextMoonQuarter(mq);
  }

  // Личный лунный цикл
  const moonN = natal('moon')!;
  const rets = lunarReturns(moonN, t0 - 30 * DAY, t1);
  const lastReturn = [...rets].reverse().find((d) => d.getTime() <= start.getTime()) ?? null;
  const nextReturn = rets.find((d) => d.getTime() > start.getTime()) ?? null;
  for (const d of rets) {
    if (d.getTime() < t0) continue;
    events.push({
      date: d, kind: 'lunar-return', tone: 'good',
      title: c.hd.type === 'reflector' ? 'Начало вашего лунного цикла' : 'Луна на своём месте: эмоциональная перезагрузка',
      text: c.hd.type === 'reflector'
        ? 'Луна вернулась туда, где была при рождении. Старт нового 28-дневного цикла: решение, которое вынашивали прошлый цикл, можно принимать.'
        : 'Луна вернулась туда, где была при рождении. Пара дней, когда легче понять, чего вы на самом деле хотите в этом месяце.',
    });
  }

  // Ретроградные планеты
  const speed = (p: Exclude<Planet, 'sun' | 'moon'>, t: number) => diff(longitude(p, new Date(t + DAY / 2)), longitude(p, new Date(t - DAY / 2)));
  for (const p of RETRO_PL) {
    let prev = speed(p, t0);
    if (prev < 0) {
      let end: Date | null = null;
      for (let t = t0 + DAY; t < t0 + 200 * DAY; t += DAY) { if (speed(p, t) >= 0) { end = bisect((x) => speed(p, x), t - DAY, t); break; } }
      events.push({date: new Date(t0), end: end ?? undefined, kind: 'retro', tone: 'care', title: `${PL_RU[p]} ретроградный${end ? ` до ${fmtShort(end)}` : ''}`, text: RETRO_TEXT[p]});
    }
    for (let t = t0 + DAY; t <= t1; t += DAY) {
      const cur = speed(p, t);
      if (prev >= 0 && cur < 0) {
        const s = bisect((x) => speed(p, x), t - DAY, t);
        let end: Date | null = null;
        for (let u = t + DAY; u < t + 200 * DAY; u += DAY) { if (speed(p, u) >= 0) { end = bisect((x) => speed(p, x), u - DAY, u); break; } }
        events.push({date: s, end: end ?? undefined, kind: 'retro', tone: 'care', title: `${PL_RU[p]} ретроградный${end ? ` до ${fmtShort(end)}` : ''}`, text: RETRO_TEXT[p]});
      }
      if (prev < 0 && cur >= 0) {
        events.push({date: bisect((x) => speed(p, x), t - DAY, t), kind: 'direct', tone: 'good', title: `${PL_RU[p]} снова прямой`, text: 'Можно возвращаться к отложенному: подписывать, запускать, покупать.'});
      }
      prev = cur;
    }
  }

  // Затмения
  let le = A.SearchLunarEclipse(new Date(t0));
  while (le.peak.date.getTime() < t1) {
    events.push({date: le.peak.date, kind: 'eclipse', tone: 'care', title: `Лунное затмение ${SIGN_IN[signOf(longitude('moon', le.peak.date))]}`, text: 'Что-то заканчивается быстрее, чем планировали. Не начинать важного за три дня до и после, отпускать то, что держится на силе воли.'});
    le = A.NextLunarEclipse(le.peak);
  }
  let se = A.SearchGlobalSolarEclipse(new Date(t0));
  while (se.peak.date.getTime() < t1) {
    events.push({date: se.peak.date, kind: 'eclipse', tone: 'care', title: `Солнечное затмение ${SIGN_IN[signOf(longitude('sun', se.peak.date))]}`, text: 'Резкий поворот и новые двери. Наблюдать, а решения принимать через неделю, когда станет понятно, куда дует ветер.'});
    se = A.NextGlobalSolarEclipse(se.peak);
  }

  // Солнце: знаки, ворота человека, каналы, которые оно замыкает
  let prevSign = signOf(longitude('sun', new Date(t0)));
  let gateStart = t0;
  let prevGate = gateOf(longitude('sun', new Date(t0))).gate;
  const flushGate = (g: number, from: number, to: number) => {
    const has = myGates.has(g);
    const partner = CHANNELS.find(([a, b]) => (a === g && myGates.has(b)) || (b === g && myGates.has(a)));
    if (has) {
      events.push({date: new Date(from), end: new Date(to), kind: 'sun-gate', tone: 'good', title: `Солнце в ваших воротах ${g}: ${lib.gateTitle(g)}`, text: 'Тема ворот звучит громче обычного: всё, что с ней связано, получается легче и заметнее.'});
    } else if (partner) {
      const key = `${partner[0]}-${partner[1]}`;
      events.push({date: new Date(from), end: new Date(to), kind: 'sun-channel', tone: 'good', title: `Солнце замыкает канал ${key}: ${lib.channelTitle(key)}`, text: 'На эти дни у вас временно включается канал, которого нет от рождения. Пробуйте его на вкус, но не стройте на нём долгих планов.'});
    }
  };
  for (let t = t0 + DAY / 4; t <= t1; t += DAY / 4) {
    const lon = longitude('sun', new Date(t));
    const s = signOf(lon);
    if (s !== prevSign) {
      const at = bisect((x) => (signOf(longitude('sun', new Date(x))) === s ? 1 : -1), t - DAY / 4, t, 16);
      events.push({date: at, kind: 'sun-sign', tone: 'neutral', title: `Солнце ${SIGN_IN[s]}${cusps ? `, ваш ${houseOf(lon, cusps)} дом` : ''}`, text: 'Месяц, когда в фокусе эта сфера жизни.'});
      prevSign = s;
    }
    const g = gateOf(lon).gate;
    if (g !== prevGate) { flushGate(prevGate, gateStart, t); gateStart = t; prevGate = g; }
  }

  // Транзиты медленных планет к Солнцу, Луне, Асценденту и MC
  const targets = (['sun', 'moon', 'asc', 'mc'] as const).filter((k) => natal(k) !== undefined && (c.timeKnown || k === 'sun'));
  for (const p of ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const) {
    const lonAt = (t: number) => longitude(p, new Date(t));
    for (const k of targets) {
      const nl = natal(k)!;
      for (const asp of ASPECTS) {
        for (const sign of asp.a === 0 || asp.a === 180 ? [1] : [1, -1]) {
          const f = (t: number) => diff(lonAt(t), nl + sign * asp.a);
          let prev = f(t0);
          for (let t = t0 + DAY; t <= t1; t += DAY) {
            const cur = f(t);
            if ((prev < 0) !== (cur < 0) && Math.abs(cur - prev) < 5) {
              const at = bisect(f, t - DAY, t);
              const {text, tone} = transitText(p, asp.soft, k);
              events.push({date: at, kind: 'transit', tone, title: `${PL_RU[p]} ${asp.ru} ${asp.a === 0 ? TARGET_INS[k] : TARGET_DAT[k]}`, text: `${text} Действует около двух недель вокруг даты.`});
            }
            prev = cur;
          }
        }
      }
    }
  }

  // День рождения и личные месяцы
  const by = c.person;
  for (let y = start.getFullYear(); y <= start.getFullYear() + 1; y++) {
    const bd = new Date(y, by.m - 1, by.d, 12);
    if (bd.getTime() >= t0 && bd.getTime() < t1) {
      const py = reduce9(digitSum(by.d) + digitSum(by.m) + digitSum(y));
      events.push({date: bd, kind: 'birthday', tone: 'good', title: 'День рождения', text: `Начинается личный год ${py}. Хороший день, чтобы записать намерение на год и выбрать одно главное дело.`});
    }
  }
  const pyOf = (d: Date) => reduce9(digitSum(by.d) + digitSum(by.m) + digitSum(d.getFullYear()));
  const pmOf = (d: Date) => reduce9(pyOf(d) + digitSum(d.getMonth() + 1));
  for (let i = 1; i < count; i++) {
    const d = new Date(t0 + i * DAY + DAY / 2);
    if (d.getDate() === 1) events.push({date: d, kind: 'pmonth', tone: 'neutral', title: `Личный месяц ${pmOf(d)}`, text: `${PMONTH[pmOf(d)]}.`.replace(/^./, (x) => x.toUpperCase())});
  }

  // Дни
  const dm = stemElement(['jia', 'yi', 'bing', 'ding', 'wu', 'ji', 'geng', 'xin', 'ren', 'gui'].indexOf(c.bazi.dayMaster));
  const days: Day[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(t0 + i * DAY);
    const noon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
    const ml = longitude('moon', noon);
    const mg = gateOf(ml).gate;
    const partner = myGates.has(mg) ? null : CHANNELS.find(([a, b]) => (a === mg && myGates.has(b)) || (b === mg && myGates.has(a)));
    const cyc = (jdn(d.getFullYear(), d.getMonth() + 1, d.getDate()) + 49) % 60;
    const stem = cyc % 10, branch = cyc % 12;
    // стихия дня: ствол весит больше ветви
    const de = stemElement(stem);
    const pd = reduce9(pmOf(noon) + digitSum(d.getDate()));
    const ph = A.MoonPhase(noon);
    days.push({
      date: noon, moonSign: signOf(ml), moonHouse: cusps ? houseOf(ml, cusps) : null,
      moonGate: mg, moonGateMine: myGates.has(mg), moonChannel: partner ? `${partner[0]}-${partner[1]}` : null,
      phase: ph, light: A.Illumination(A.Body.Moon, noon).phase_fraction,
      personalDay: pd, relation: relation(dm, de), pillar: {stem, branch}, events: [],
    });
  }
  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  for (const e of events) {
    const i = Math.floor((new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate()).getTime() - t0) / DAY);
    if (i >= 0 && i < days.length) days[i].events.push(e);
  }
  return {days, events: events.filter((e) => e.date.getTime() >= t0 || e.end), lastReturn, nextReturn};
}

export const PHASE_RU = (deg: number) =>
  deg < 10 || deg > 350 ? 'Новолуние' : deg < 80 ? 'Растущий серп' : deg < 100 ? 'Первая четверть' : deg < 170 ? 'Растущая Луна' :
  deg < 190 ? 'Полнолуние' : deg < 260 ? 'Убывающая Луна' : deg < 280 ? 'Последняя четверть' : 'Старая Луна';

/** Файл календаря .ics со всеми датами. */
export function toIcs(name: string, evs: Ev[]): string {
  const d8 = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Marshrut//RU', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:Маршрут: ${esc(name)}`];
  evs.forEach((e, i) => {
    const end = e.end && e.end.getTime() - e.date.getTime() < 40 * DAY ? e.end : new Date(e.date.getTime() + DAY);
    lines.push('BEGIN:VEVENT', `UID:${d8(e.date)}-${i}@marshrut`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d8(e.date)}`,
      `DTEND;VALUE=DATE:${d8(new Date(Math.max(end.getTime(), e.date.getTime() + DAY)))}`, `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.text)}`, 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
