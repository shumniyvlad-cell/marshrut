// Раздел «Даты»: сегодня, неделя по дням, месяц и три месяца событий, экспорт в календарь.
import {useMemo, useState} from 'react';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {CalendarDaysIcon} from '@heroicons/react/24/outline';
import type {Calc} from './engine';
import type {Library} from './content';
import {forecast, toIcs, PDAY, RELATION, PHASE_RU, DAY, type Day, type Ev, type Forecast} from './engine/forecast';
import {SIGN_IN} from './engine/astro';
import {TYPE_RU} from './engine/hd';
import {typo} from './format';

const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const WD_LONG = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const dm = (d: Date) => d.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'});
const monthName = (d: Date) => d.toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'});
const plusDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const monthGen = (d: Date) => dm(d).replace(/^\d+\s/, '');
/** «23, 26 и 27 ноября, 2 декабря» */
function listDates(ds: Date[]): string {
  const groups: {m: string; days: number[]}[] = [];
  for (const d of ds) {
    const m = monthGen(d);
    const last = groups[groups.length - 1];
    if (last && last.m === m) last.days.push(d.getDate()); else groups.push({m, days: [d.getDate()]});
  }
  return groups.map((g) => {
    const n = g.days.map(String);
    return `${n.length > 1 ? `${n.slice(0, -1).join(', ')} и ${n[n.length - 1]}` : n[0]} ${g.m}`;
  }).join(', ');
}

export function useForecast(calc: Calc, lib: Library): Forecast {
  return useMemo(() => forecast(calc, {
    gateTitle: (g) => lib.hd.gates[String(g)]?.title.replace(/^Ворота \d+\.\s*/, '') ?? '',
    channelTitle: (k) => lib.hd.channels[k]?.title.replace(/^Канал [\d–-]+\.\s*/, '') ?? '',
  }), [calc, lib]);
}

/** Луна с правильной фазой: справа растёт, слева убывает. */
export function MoonIcon({phase, size = 28}: {phase: number; size?: number}) {
  const r = 10, cx = 12, cy = 12;
  const p = ((phase % 360) + 360) % 360;
  const rx = r * Math.abs(Math.cos((p * Math.PI) / 180));
  let d: string;
  if (p < 180) d = `M${cx},${cy - r} A${r},${r} 0 0 1 ${cx},${cy + r} A${rx},${r} 0 0 ${p < 90 ? 0 : 1} ${cx},${cy - r} Z`;
  else d = `M${cx},${cy - r} A${r},${r} 0 0 0 ${cx},${cy + r} A${rx},${r} 0 0 ${p > 270 ? 1 : 0} ${cx},${cy - r} Z`;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="moon" aria-hidden>
      <circle cx={cx} cy={cy} r={r} className="moon__dark" />
      {p > 3 && p < 357 && <path d={d} className="moon__lit" />}
    </svg>
  );
}

/** Конкретные даты для стратегии и авторитета. */
function strategyLines(calc: Calc, f: Forecast, today: Date): {title: string; lines: string[]} {
  const t = calc.hd.type, a = calc.hd.authority;
  const lines: string[] = [];
  if (t === 'reflector' || a === 'lunar') {
    if (f.lastReturn && f.nextReturn) {
      lines.push(`Ваш лунный цикл идёт с ${dm(f.lastReturn)}, следующий начнётся ${dm(f.nextReturn)}.`);
      lines.push(`Вопрос, который появился сегодня, решать не раньше ${dm(plusDays(today, 28))}: Луна должна пройти все 64 ворот.`);
      lines.push('Обсуждайте его с разными людьми в течение цикла и слушайте, как он звучит в разных местах.');
    }
  } else if (a === 'emotional') {
    lines.push(`Решение, пришедшее сегодня: ответ не раньше ${dm(plusDays(today, 1))}, после ночи сна.`);
    lines.push(`Крупное (деньги, переезд, отношения): дать волне пройти неделю, до ${dm(plusDays(today, 7))}.`);
  } else if (a === 'sacral') {
    lines.push('Отвечать телом сразу, в моменте: «угу» или «неа». Ждать даты не нужно.');
  } else if (a === 'splenic') {
    lines.push('Первый тихий сигнал звучит один раз, в моменте. Записывайте его сразу.');
  } else {
    lines.push('Проговорите вопрос вслух двум людям, которым доверяете, в ближайшие три дня, и решайте там, где вам спокойно.');
  }
  const next = (pred: (d: Day) => boolean, n = 3) => listDates(f.days.slice(0, 21).filter(pred).slice(0, n).map((d) => d.date));
  const starts = next((d) => d.personalDay === 1 || (d.personalDay === 3 && d.relation !== 'power'));
  const money = next((d) => d.personalDay === 8 || d.relation === 'wealth');
  const rest = next((d) => d.personalDay === 7 || d.relation === 'resource');
  if (t === 'projector') lines.push(`Дни, когда показываться и ловить приглашения: ${starts}.`);
  else if (t === 'manifestor') lines.push(`Дни для старта (не забудьте сообщить близким заранее): ${starts}.`);
  else lines.push(`Дни для старта и видимости: ${starts}.`);
  if (money) lines.push(`Дни для денег и сделок: ${money}.`);
  if (rest) lines.push(`Дни для восстановления: ${rest}.`);
  return {title: `${TYPE_RU[t]}: как решать в ближайшие дни`, lines};
}

export function WeekStrip({f, selected, onSelect, count = 7}: {f: Forecast; selected: number; onSelect: (i: number) => void; count?: number}) {
  return (
    <ol className="week" aria-label="Ближайшие дни">
      {f.days.slice(0, count).map((d, i) => {
        const tone = d.events.some((e) => e.tone === 'care') || d.relation === 'power' ? 'care' : RELATION[d.relation].tone;
        return (
          <li key={i}>
            <button type="button" className={`week__day is-${tone}${i === selected ? ' is-on' : ''}`} aria-pressed={i === selected} onClick={() => onSelect(i)}>
              <span className="week__wd">{i === 0 ? 'сегодня' : WD[d.date.getDay()]}</span>
              <span className="week__n">{d.date.getDate()}</span>
              <MoonIcon phase={d.phase} size={22} />
              <span className="week__t">{PDAY[d.personalDay].title}</span>
              {d.events.length > 0 && <span className="week__ev" aria-label={`событий: ${d.events.length}`}>{d.events.length}</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function DayCard({d, calc}: {d: Day; calc: Calc}) {
  const rel = RELATION[d.relation];
  return (
    <article className="dayc glass-card">
      <HStack gap={4} vAlign="center" wrap="wrap">
        <span className="dayc__n">{d.date.getDate()}</span>
        <VStack gap={0}>
          <Text type="large" weight="semibold">{dm(d.date)}, {WD_LONG[d.date.getDay()]}</Text>
          <Text color="secondary">{PHASE_RU(d.phase)}, освещена на {Math.round(d.light * 100)}%</Text>
        </VStack>
      </HStack>
      <dl className="dayc__grid">
        <div><dt>Личный день {d.personalDay}</dt><dd><b>{PDAY[d.personalDay].title}.</b> {typo(PDAY[d.personalDay].hint)}</dd></div>
        <div><dt>Ба Цзы: день и вы</dt><dd><b className={`tone-${rel.tone}`}>{rel.title}.</b> {typo(rel.hint)}</dd></div>
        <div><dt>Луна</dt><dd>{SIGN_IN[d.moonSign].replace(/^в/, 'В')}{d.moonHouse ? `, ваш ${d.moonHouse} дом` : ''}{calc.timeKnown ? '' : ''}</dd></div>
        <div><dt>Луна в Дизайне человека</dt><dd>
          Ворота {d.moonGate}{d.moonGateMine ? ', ваши: тема звучит громче' : d.moonChannel ? `, замыкают ваш канал ${d.moonChannel} на день` : ''}
        </dd></div>
      </dl>
      {d.events.length > 0 && (
        <ul className="dayc__ev">{d.events.map((e, i) => <li key={i} className={`tone-${e.tone}`}><b>{e.title}.</b> {typo(e.text)}</li>)}</ul>
      )}
    </article>
  );
}

function Timeline({events, from, to}: {events: Ev[]; from: number; to: number}) {
  const list = events.filter((e) => (e.date.getTime() >= from && e.date.getTime() < to) || (e.end && e.date.getTime() < from && e.end.getTime() > from));
  const groups = new Map<string, Ev[]>();
  for (const e of list) {
    const key = monthName(e.date.getTime() < from ? new Date(from) : e.date);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  if (!list.length) return <Text color="secondary">В этот период нет заметных событий.</Text>;
  return (
    <VStack gap={8}>
      {[...groups].map(([m, evs]) => (
        <section key={m} aria-label={m}>
          <Heading level={3} className="tl__month">{m}</Heading>
          <ol className="tl">
            {evs.map((e, i) => (
              <li key={i} className={`tl__item tone-${e.tone}`}>
                <span className="tl__date">
                  <span className="tl__n">{e.date.getTime() < from ? 'идёт' : e.date.getDate()}</span>
                  <span className="tl__wd">{e.date.getTime() < from ? '' : WD[e.date.getDay()]}</span>
                </span>
                <span className="tl__body">
                  <Text weight="semibold" type="large">{e.title}</Text>
                  {e.end && e.kind !== 'retro' && <Text size="sm" color="secondary">до {dm(e.end)}</Text>}
                  <Text color="secondary" textWrap="pretty">{typo(e.text)}</Text>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </VStack>
  );
}

export function DatesSection({calc, lib}: {calc: Calc; lib: Library}) {
  const f = useForecast(calc, lib);
  const [sel, setSel] = useState(0);
  const [range, setRange] = useState<'month' | 'q'>('month');
  const today = f.days[0].date;
  const st = strategyLines(calc, f, new Date());
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const to = from + (range === 'month' ? 31 : 92) * DAY;

  const ics = () => {
    const blob = new Blob([toIcs(calc.person.name, f.events.filter((e) => e.kind !== 'quarter'))], {type: 'text/calendar'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `marshrut-${calc.person.name.split(' ')[0].toLowerCase()}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  return (
    <VStack gap={10}>
      <section className="now">
        <VStack gap={1} className="now__date">
          <span className="now__n">{today.getDate()}</span>
          <Text type="large">{monthGen(today)}, {WD_LONG[today.getDay()]}</Text>
        </VStack>
        <HStack gap={4} vAlign="center" className="now__moon">
          <MoonIcon phase={f.days[0].phase} size={72} />
          <VStack gap={0.5}>
            <Text type="large" weight="semibold">{PHASE_RU(f.days[0].phase)}</Text>
            <Text color="secondary">Луна {SIGN_IN[f.days[0].moonSign]}, освещена на {Math.round(f.days[0].light * 100)}%</Text>
            {f.nextReturn && <Text color="secondary">Ваш следующий лунный цикл: {dm(f.nextReturn)}</Text>}
          </VStack>
        </HStack>
      </section>

      <section className="strat glass-card" aria-labelledby="h-strat">
        <Heading level={2} id="h-strat">{st.title}</Heading>
        <ul className="strat__list">{st.lines.map((l) => <li key={l}><Text type="large" textWrap="pretty">{typo(l)}</Text></li>)}</ul>
      </section>

      <section aria-labelledby="h-week" className="sec">
        <VStack gap={2} className="sec__head">
          <Heading level={2} id="h-week" type="display-3">Неделя по дням</Heading>
          <Text type="large" color="secondary">Нажмите на день: личный день, Ба Цзы, Луна и события.</Text>
        </VStack>
        <WeekStrip f={f} selected={sel} onSelect={setSel} />
        <DayCard d={f.days[sel]} calc={calc} />
      </section>

      <section aria-labelledby="h-tl" className="sec">
        <HStack justify="between" vAlign="end" gap={3} wrap="wrap">
          <VStack gap={2} className="sec__head">
            <Heading level={2} id="h-tl" type="display-3">Важные даты</Heading>
            <Text type="large" color="secondary">Луна, лунный цикл, ретроградные планеты, затмения, транзиты к вашей карте.</Text>
          </VStack>
          <HStack gap={3} vAlign="center" wrap="wrap">
            <SegmentedControl label="Период" value={range} onChange={(v) => setRange(v as 'month' | 'q')}>
              <SegmentedControlItem value="month" label="Месяц" />
              <SegmentedControlItem value="q" label="3 месяца" />
            </SegmentedControl>
            <Button label="В календарь телефона" variant="secondary" icon={<CalendarDaysIcon />} onClick={ics} tooltip="Файл .ics: откройте его, и даты встанут в календарь" />
          </HStack>
        </HStack>
        <Timeline events={f.events} from={from} to={to} />
      </section>
      <Text size="sm" color="secondary">Время и даты по часовому поясу этого устройства.</Text>
    </VStack>
  );
}
