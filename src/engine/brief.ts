// Краткий разбор для клиента по системе Юлии Каряпкиной: пять показателей (сила и баг), внутренний конфликт,
// точка А и Б, маршрутный лист и «делать / не делать» человеческим языком, без эзотерики.
// digits, CORE, YEAR, BLOCKS и ruDate перенесены дословно из приложения «Перепрошивка» (src/route/numbers.ts).
import type {Person} from './index';
import type {Item, Route, Sphere} from './route';

const sum = (s: string | number) => String(s).replace(/\D/g, '').split('').reduce((a, d) => a + Number(d), 0);
export const reduce = (n: number): number => (n <= 9 ? n : reduce(sum(n))); // всё до одной цифры, без 11 и 22

// таблица Пифагора: А=1, Б=2 … И=1, Й=2 … (латиница так же)
const RU = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
const EN = 'abcdefghijklmnopqrstuvwxyz';
const letter = (c: string) => {
  const r = RU.indexOf(c);
  if (r >= 0) return (r % 9) + 1;
  const e = EN.indexOf(c);
  return e >= 0 ? (e % 9) + 1 : 0;
};

export type Digits = {day: number; path: number; month: number; name: number; year: number; yearFrom: string; yearTo: string};

// личный год сменяется в день рождения, а не 1 января
export function digits(name: string, birth: string, now = new Date()): Digits | null {
  const m = birth.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const passed = now.getMonth() + 1 > Number(mo) || (now.getMonth() + 1 === Number(mo) && now.getDate() >= Number(d));
  const cycle = passed ? now.getFullYear() : now.getFullYear() - 1;
  const letters = name.trim().toLowerCase().split('').map(letter).filter(Boolean);
  return {
    day: reduce(Number(d)),
    path: reduce(sum(y) + sum(mo) + sum(d)),
    month: reduce(Number(mo)),
    name: letters.length ? reduce(letters.reduce((a, b) => a + b, 0)) : 0,
    year: reduce(reduce(Number(d)) + reduce(Number(mo)) + reduce(sum(cycle))),
    yearFrom: `${cycle}-${mo}-${d}`,
    yearTo: `${cycle + 1}-${mo}-${d}`,
  };
}

// ядро трактовки Юли: сила (в плюсе) и баг (в минусе)
export const CORE: Record<number, {title: string; plus: string; minus: string}> = {
  1: {title: 'Лидерство и воля', plus: 'Стратег, первопроходец, умение брать ответственность и вести за собой.', minus: 'Диктатура, гордыня, неумение делегировать («всё тащу сам»).'},
  2: {title: 'Партнёрство и дипломатия', plus: 'Глубокое понимание людей, эмпатия, умение договариваться и соединять ресурсы.', minus: 'Вечные сомнения, зависимость от чужого мнения, страх конфликта и потеря себя в других.'},
  3: {title: 'Экспертиза и анализ', plus: 'Глубокие знания, системный ум, наставничество, умение разложить хаос по полочкам.', minus: 'Синдром вечного студента, перфекционизм, стыд называть высокую цену («я ещё недостаточно знаю»).'},
  4: {title: 'Система и порядок', plus: 'Структурность, дисциплина, умение строить фундамент и доводить проекты до твёрдого результата.', minus: 'Жёсткость, страх нового, застревание в тяжёлой рутине и гиперконтроль.'},
  5: {title: 'Масштаб, коммуникации и свобода', plus: 'Скорость, логика, медийность, продажи, умение видеть выгоду и объединять людей.', minus: 'Распыление на 10 идей сразу, хаос, отсутствие дисциплины и быстрое выгорание от скуки.'},
  6: {title: 'Сервис, комфорт и ценность', plus: 'Вкус, качество продукта, создание тёплого пространства, притягательность и умение работать с высоким чеком.', minus: 'Спасательство, желание быть «хорошим для всех», завышенные ожидания и обидчивость.'},
  7: {title: 'Трансформация и стратегия', plus: 'Интуиция, аналитика высшего порядка, создание своих методик, глубина и независимость.', minus: 'Закрытость, уход в голову от реальных действий, тревожность и кризисы при потере фокуса.'},
  8: {title: 'Деньги, власть и материальный результат', plus: 'Масштаб, контракты, управление процессами и капиталом, твёрдая хватка.', minus: 'Трудоголизм на износ, жадность или, наоборот, страх больших денег и нарушение баланса «давать — брать».'},
  9: {title: 'Служение, скорость и влияние', plus: 'Мощная энергия действия, масштабные идеи, быстрый запуск и способность вдохновлять массы.', minus: 'Суета, эмоциональные качели, обесценивание своих результатов и слив сил на чужие проблемы.'},
};

// стратегия личного года (черновик по ядру Юли — ждёт её правок)
export const YEAR: Record<number, string> = {
  1: 'Год запуска и решений: начинать новое и брать ответственность',
  2: 'Год партнёрств: договариваться, собирать союзников, не спешить',
  3: 'Год экспертизы: упаковать знания и поднять цену',
  4: 'Год системы: строить фундамент и наводить порядок',
  5: 'Год масштаба: запуски, трафик, публичность и новый финансовый уровень',
  6: 'Год ценности: продукт, сервис, работа с высоким чеком и выход из спасательства',
  7: 'Год стратегии и трансформации: глубокая пересборка, создание своей системы и фокус',
  8: 'Год денег и контрактов: дожимать результат',
  9: 'Год чистки: закрыть хвосты и отпустить лишнее',
};

// пять показателей в порядке Юли (у имени подпись «люди», как в её версии для найма и службы)
export const BLOCKS: {key: 'day' | 'path' | 'month' | 'name' | 'year'; title: string; what: string}[] = [
  {key: 'day', title: 'Как работает твой мозг', what: 'Главный талант, способ принимать решения и слепая зона, через которую утекает энергия.'},
  {key: 'path', title: 'Твоя реализация', what: 'Через какие действия приходят деньги, статус и рост, а где ждёт тупик.'},
  {key: 'month', title: 'Твоя рабочая среда', what: 'Формат работы и окружения, где ты раскрываешься, а не выгораешь.'},
  {key: 'name', title: 'Как тебя считывают люди', what: 'Какое впечатление ты производишь на клиентов, партнёров и начальство.'},
  {key: 'year', title: 'Твой текущий цикл', what: 'Главный фокус на 12 месяцев, со дня рождения до следующего.'},
];

export const ruDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'});

/* ───── сборка краткого разбора ───── */

export type Row = {label: string; text: string; tone?: 'bug'};
export type Card = {key: string; n: number; title: string; core: string; what: string; rows: Row[]};
export interface Brief {
  cards: Card[];
  conflict: {text: string; exit: string} | null;
  from: string;
  to: string;
  sheet: {label: string; text: string}[];
  doList: string[];
  dontList: string[];
}

const pad = (n: number) => String(n).padStart(2, '0');
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';
const low = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
// во фразе конфликта без цифр: «на 10 идей» → «на десяток идей»
const bare = (s: string) => low(s.trim().replace(/[.\s]+$/, '').replace(/(?<!\d)10 /g, 'десяток '));

/** Термины систем, цифры, мистика и обращение на «вы» — в кратком разборе этого быть не должно. */
export const JARGON = new RegExp([
  '\\d', 'отклик', 'телом', 'телесн', 'сигнал(?!ы тела)', 'на роль', 'волн[аеуы]', 'внутренн\\S* зов', '(?<![а-яё])удач', 'цикл', 'проекци',
  'судьб', 'карм', 'вселенн', 'аркан', 'матриц', 'ворот', 'канал', 'центр', 'планет', '(?<![а-яё])лун[аыуеой]', 'солнц', 'ба цзы', 'стихи',
  'генн', 'сиддх', 'авторитет', 'проектор', 'генератор', 'манифест', 'рефлектор', 'натал', 'зодиак', 'ретроград', 'хвост', 'узл[аыеу]', 'узел',
  'чакр', 'медитац', 'духовн', 'предназнач', 'прошл\\S* жизн', 'астро', 'нумеролог', 'дизайн человека', 'энерги\\S* (вселенн|космос|рода|земли)',
  '(?<![а-яё])(вы|вас|вам|вами|ваш[а-яё]*)(?![а-яё])',
].join('|'), 'i');
export const isHuman = (s: string) => !JARGON.test(s);

const SHEET: [Sphere, string][] = [['decisions', 'Решения'], ['work', 'Дело и деньги'], ['energy', 'Силы и восстановление']];

export function buildBrief(p: Person, route: Route, now = new Date()): Brief {
  const d = digits(firstName(p.name), `${p.y}-${pad(p.m)}-${pad(p.d)}`, now);
  const cards: Card[] = !d ? [] : BLOCKS.flatMap((b) => {
    const n = d[b.key];
    if (!n) return [];
    const core = CORE[n];
    const rows: Row[] = [];
    if (b.key === 'day' || b.key === 'path') rows.push({label: 'Сила', text: core.plus}, {label: 'Баг', text: core.minus, tone: 'bug'});
    if (b.key === 'month') rows.push({label: 'Среда', text: core.plus});
    if (b.key === 'name') rows.push({label: 'Тебя считывают так', text: core.plus});
    if (b.key === 'year') rows.push({label: `С ${ruDate(d.yearFrom)} по ${ruDate(d.yearTo)}`, text: `${YEAR[n]}.`});
    return [{key: b.key, n, title: b.title, core: core.title, what: b.what, rows}];
  });

  // конфликт: как считывают снаружи (сила имени) против того, что включается внутри (баг дня рождения)
  let conflict: Brief['conflict'] = null;
  if (d && d.name) {
    const out = CORE[d.name], inn = CORE[d.day];
    const text = d.name === d.day
      ? `Снаружи и внутри у тебя работает одно качество: ${low(out.title)}. Люди видят его сильную сторону: ${bare(out.plus)}. А под нагрузкой оно же оборачивается багом: ${bare(inn.minus)}.`
      : `Снаружи тебя считывают так: ${bare(out.plus)}. А внутри, когда растёт нагрузка, включается другое: ${bare(inn.minus)}. Люди ждут от тебя одного, а силы уходят на борьбу с собой: отсюда усталость и ощущение, что настоящего тебя не видят.`;
    conflict = {text, exit: 'Замечать момент, когда включается баг, и возвращаться к своей сильной стороне раньше, чем он заберёт ресурс.'};
  }

  // маршрутный лист и «делать / не делать»: только пункты, понятные без терминов
  const used = new Set<string>();
  const take = (items: Item[], n: number) => {
    const out: string[] = [];
    for (const it of items) {
      if (out.length >= n) break;
      if (used.has(it.text) || !isHuman(it.text)) continue;
      used.add(it.text);
      out.push(it.text);
    }
    return out;
  };
  const byWeight = (r: Record<Sphere, Item[]>) => Object.values(r).flat().sort((a, b) => b.weight - a.weight);
  const sheet = SHEET.flatMap(([s, label]) => take(route.doAll[s], 1).map((text) => ({label, text})));
  if (sheet.length < 3) take(byWeight(route.doAll), 3 - sheet.length).forEach((text) => sheet.push({label: 'Шаг', text}));
  const doList = take([...route.doTop, ...byWeight(route.doAll)], 5);
  const dontList = take([...route.dontTop, ...byWeight(route.dontAll)], 5);

  return {cards, conflict, from: p.from?.trim() ?? '', to: p.to?.trim() ?? '', sheet, doList, dontList};
}
