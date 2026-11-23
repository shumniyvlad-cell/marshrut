// Главная: настоящее небо Уэбба, живая карта неба сейчас, клиенты, сюжет «семь систем → один маршрут», даты и обои.
import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {List, ListItem} from '@astryxdesign/core/List';
import {Skeleton} from '@astryxdesign/core/Skeleton';
import {ArrowRightIcon, PlusIcon} from '@heroicons/react/24/outline';
import {natalChart, SIGN_IN, SIGN_RU} from './engine/astro';
import {gateOf, TYPE_RU} from './engine/hd';
import {compute} from './engine';
import {AUTH_RULE, buildRoute} from './engine/route';
import {forecast, PHASE_RU} from './engine/forecast';
import {ANIMAL_RU, BRANCH_HAN, STEM_HAN, pillarRu} from './engine/bazi';
import {loadLibrary, type Library} from './content';
import {Bodygraph, MatrixChart, NatalWheel, PythagorasGrid} from './charts';
import {MoonIcon, WeekStrip, DayCard} from './dates';
import {drawWall, ensureFonts} from './wall';
import {SAMPLE, store, useStore} from './store';
import {birthLine} from './format';
import {go} from './App';
import * as A from 'astronomy-engine';

const BASE = import.meta.env.BASE_URL;

function useNow(ms: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Наклон до 7° и блик за курсором — только мышь. */
export function Tilt({children, className = ''}: {children: ReactNode; className?: string}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    ref.current.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
    ref.current.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);
    ref.current.style.setProperty('--gx', `${x * 100}%`);
    ref.current.style.setProperty('--gy', `${y * 100}%`);
  };
  const reset = () => {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };
  return <div ref={ref} className={`tilt ${className}`} onPointerMove={onMove} onPointerLeave={reset}>{children}<i className="tilt__glare" aria-hidden /></div>;
}

function useLibraryLazy(target: React.RefObject<HTMLElement | null>) {
  const [lib, setLib] = useState<Library | null>(null);
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); loadLibrary().then(setLib).catch(() => {}); }
    }, {rootMargin: '600px'});
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return lib;
}

export function Home({onNew}: {onNew: () => void}) {
  const {people} = useStore();
  const now = useNow(60000);
  const sky = useMemo(() => natalChart(now, null, null, false), [now]);
  const moon = sky.placements.find((p) => p.id === 'moon')!;
  const sun = sky.placements.find((p) => p.id === 'sun')!;
  const phase = A.MoonPhase(now);
  const light = A.Illumination(A.Body.Moon, now).phase_fraction;

  const sample = useMemo(() => compute(SAMPLE), []);
  const fc = useMemo(() => forecast(sample, {gateTitle: () => '', channelTitle: () => ''}, new Date(), 7), [sample]);
  const [day, setDay] = useState(0);

  const openSample = () => {
    if (!store.get().people.some((p) => p.id === SAMPLE.id)) store.save({...SAMPLE, createdAt: Date.now()});
    go(`/r/${SAMPLE.id}`);
  };

  return (
    <>
      <section className="hero dark-zone">
        <picture>
          <source media="(max-width: 700px)" srcSet={`${BASE}img/sky-m.webp`} />
          <img className="hero__bg" src={`${BASE}img/sky.webp`} alt="" width={1920} height={1111} fetchPriority="high" />
        </picture>
        <div className="hero__in">
          <VStack gap={6} className="hero__text">
            <Text className="kicker">Инструмент для цифровых психологов и астрологов</Text>
            <h1 className="hero__h">
              Весь человек
              <br />
              <span className="hero__it">по одной дате</span>
            </h1>
            <Text type="large" className="hero__sub" textWrap="pretty">
              Астрология, Дизайн человека, Матрица судьбы, Пифагор, нумерология, Ба&nbsp;Цзы и&nbsp;Генные ключи
              в&nbsp;одном разборе. Из&nbsp;него маршрут: что делать, что не&nbsp;делать, какие даты впереди и&nbsp;обои с&nbsp;планом.
            </Text>
            <HStack gap={3} wrap="wrap">
              <Button label="Новый разбор" variant="primary" size="lg" icon={<PlusIcon />} onClick={onNew} />
              <Button label="Открыть пример" variant="secondary" size="lg" onClick={openSample} className="btn-glass" />
            </HStack>
          </VStack>
          <figure className="hero__sky">
            <Tilt className="disc">
              <NatalWheel chart={sky} size={440} />
            </Tilt>
            <figcaption className="nowsky">
              <span className="nowsky__item"><MoonIcon phase={phase} size={26} /><span><b>{PHASE_RU(phase)}</b>{Math.round(light * 100)}% света</span></span>
              <span className="nowsky__item"><span className="nowsky__g">☽︎</span><span><b>Луна {SIGN_IN[moon.sign]}</b>ворота {gateOf(moon.lon).gate}</span></span>
              <span className="nowsky__item"><span className="nowsky__g">☉︎</span><span><b>Солнце {SIGN_IN[sun.sign]}</b>ворота {gateOf(sun.lon).gate}</span></span>
            </figcaption>
          </figure>
        </div>
        <Text size="sm" className="hero__credit">Небо сейчас считается в браузере. Фото: телескоп «Джеймс Уэбб», NASA, ESA, CSA, STScI</Text>
      </section>

      {people.length > 0 && (
        <section className="col col--wide block" aria-labelledby="people">
          <HStack justify="between" vAlign="end" gap={3} wrap="wrap">
            <Heading level={2} id="people" type="display-2">Ваши клиенты</Heading>
            <Button label="Новый разбор" variant="primary" icon={<PlusIcon />} onClick={onNew} />
          </HStack>
          <List hasDividers edge="outset">
            {people.map((p) => (
              <ListItem key={p.id} itemKey={p.id} label={p.name}
                description={<Text color="secondary" hasTabularNumbers>{birthLine(p)}</Text>}
                onClick={() => go(`/r/${p.id}`)} endContent={<ArrowRightIcon className="li-arrow" aria-hidden />} />
            ))}
          </List>
        </section>
      )}

      <Story sample={sample} />

      <section className="col col--wide block" aria-labelledby="dates-demo">
        <VStack gap={3} className="sec__head">
          <Text className="kicker">Даты</Text>
          <Heading level={2} id="dates-demo" type="display-2" textWrap="balance">Не «ждите лунный цикл», а&nbsp;до&nbsp;какого числа</Heading>
          <Text type="large" color="secondary" textWrap="pretty">
            Неделя по дням, месяц и три месяца: лунный цикл человека, новолуния, ретроградные планеты, затмения, Солнце в его воротах,
            транзиты к его карте. Ниже пример: {SAMPLE.name}, {TYPE_RU[sample.hd.type].toLowerCase()} {sample.hd.profile}.
          </Text>
        </VStack>
        <WeekStrip f={fc} selected={day} onSelect={setDay} />
        <DayCard d={fc.days[day]} calc={sample} />
      </section>

      <Walls />

      <section className="final dark-zone">
        <img className="final__bg" src={`${BASE}img/sky.webp`} alt="" loading="lazy" width={1920} height={1111} />
        <VStack gap={5} hAlign="center" className="final__in">
          <h2 className="final__h">Первый разбор за&nbsp;минуту</h2>
          <Text type="large" justify="center" textWrap="balance" className="final__p">Дата, время, город. Всё остальное посчитается само, прямо в&nbsp;браузере.</Text>
          <Button label="Новый разбор" variant="primary" size="lg" icon={<PlusIcon />} onClick={onNew} />
        </VStack>
      </section>
    </>
  );
}

/* ───── сюжет по прокрутке ───── */
const STEPS = [
  ['01', 'Астрология', 'Натальная карта с домами Плацидуса и аспектами. Каждая планета в знаке и доме расписана живым языком.'],
  ['02', 'Дизайн человека', 'Бодиграф, тип, стратегия, авторитет, профиль, каналы, ворота и инкарнационный крест.'],
  ['03', 'Матрица судьбы', '22 аркана: личность, таланты, кармический хвост, денежный канал и канал отношений.'],
  ['04', 'Квадрат Пифагора', 'Психоматрица с рабочими числами, все ячейки и линии с трактовкой.'],
  ['05', 'Нумерология', 'Число пути, личный год, числа выражения, души и личности по полному имени.'],
  ['06', 'Ба Цзы', 'Четыре столпа по солнечному календарю, хозяин дня и баланс пяти стихий.'],
  ['07', 'Маршрут', 'Всё сходится в одно: 7 «делать», 7 «не делать», сценарии с выходом, план на 90 дней и даты.'],
] as const;

function Story({sample}: {sample: ReturnType<typeof compute>}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const steps = [...root.querySelectorAll<HTMLElement>('.story__step')];
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
    }, {rootMargin: '-45% 0px -45% 0px'});
    steps.forEach((s) => io.observe(s));
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = root.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / r.height));
        root.style.setProperty('--p', p.toFixed(4));
      });
    };
    onScroll();
    addEventListener('scroll', onScroll, {passive: true});
    return () => { io.disconnect(); removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const b = sample.bazi;
  const visuals: ReactNode[] = [
    <NatalWheel key="w" chart={sample.natal} size={460} />,
    <Bodygraph key="b" hd={sample.hd} size={380} />,
    <MatrixChart key="m" m={sample.matrix} size={420} />,
    <PythagorasGrid key="p" cells={sample.py.cells} />,
    <div key="n" className="bignums"><span><b>{sample.lifePath}</b>число пути</span><span><b>{sample.personalYear}</b>личный год {sample.year}</span>{sample.name && <span><b>{sample.name.expression}</b>число имени</span>}</div>,
    <div key="z" className="minipillars">{[b.hour, b.day, b.month, b.year].map((p, i) => p && (
      <span key={i} className={i === 1 ? 'is-day' : ''}><b lang="zh">{STEM_HAN[p.stem]}{BRANCH_HAN[p.branch]}</b>{pillarRu(p.stem, p.branch)}</span>
    ))}</div>,
    <div key="r" className="minipass"><small>{SAMPLE.name}</small><b>{TYPE_RU[sample.hd.type]} {sample.hd.profile}</b><span>{AUTH_RULE[sample.hd.authority]}</span><em>{ANIMAL_RU[b.animal]}, Солнце {SIGN_IN[sample.natal.placements[0].sign]}, аркан {sample.matrix.A}</em></div>,
  ];

  return (
    <section ref={ref} className="story" aria-labelledby="story-h">
      <div className="story__rail" aria-hidden><i /></div>
      <div className="story__head col col--wide">
        <Text className="kicker">Что внутри разбора</Text>
        <Heading level={2} id="story-h" type="display-2" textWrap="balance">Семь систем сходятся в&nbsp;один маршрут</Heading>
        <Text type="large" color="secondary">Ниже живой разбор: {SAMPLE.name}, {birthLine(SAMPLE)}.</Text>
      </div>
      <div className="story__grid col col--wide">
        <div className="story__stage" aria-hidden>
          {visuals.map((v, i) => <div key={i} className={`story__vis${i === active ? ' is-on' : ''}`}>{v}</div>)}
        </div>
        <ol className="story__steps">
          {STEPS.map(([n, t, d], i) => (
            <li key={n} className={`story__step${i === active ? ' is-on' : ''}`} data-i={i}>
              <span className="story__n">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
              <div className="story__inline" aria-hidden>{visuals[i]}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───── обои ───── */
function Walls() {
  const ref = useRef<HTMLElement>(null);
  const lib = useLibraryLazy(ref);
  const desk = useRef<HTMLCanvasElement>(null);
  const phone = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!lib) return;
    const calc = compute(SAMPLE);
    const route = buildRoute(calc, lib);
    ensureFonts().then(() => {
      if (desk.current) drawWall(desk.current, route, calc.natal, SAMPLE.name, 19900512, {format: 'desktop', theme: 'night', count: 7, scenario: true, signature: ''});
      if (phone.current) drawWall(phone.current, route, calc.natal, SAMPLE.name, 19900512, {format: 'phone', theme: 'ultra', count: 5, scenario: true, signature: ''});
    });
  }, [lib]);
  return (
    <section ref={ref} className="col col--wide block" aria-labelledby="walls-h">
      <VStack gap={3} className="sec__head">
        <Text className="kicker">Обои</Text>
        <Heading level={2} id="walls-h" type="display-2" textWrap="balance">План перед глазами каждый день</Heading>
        <Text type="large" color="secondary" textWrap="pretty">Обои на компьютер и телефон с маршрутом человека. Фоном его личное небо: планеты на местах рождения.</Text>
      </VStack>
      <div className="walls">
        <figure className="walls__desk">{lib ? <canvas ref={desk} /> : <Skeleton width="100%" height={360} />}</figure>
        <figure className="walls__phone">{lib ? <canvas ref={phone} /> : <Skeleton width="100%" height={460} />}</figure>
      </div>
      <Text size="sm" color="secondary">Пример: {SAMPLE.name}, {SIGN_RU[compute(SAMPLE).natal.placements[0].sign].toLowerCase()} по Солнцу.</Text>
    </section>
  );
}
