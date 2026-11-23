// Разделы разбора. Каждый раздел — расчёт + трактовки из библиотеки.
import type {ReactNode} from 'react';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {PhotoIcon} from '@heroicons/react/24/outline';
import type {Calc} from './engine';
import type {Entry, Library} from './content';
import {SPHERE_RU, AUTH_RU, type Route, type Sphere} from './engine/route';
import {POINT_GLYPH, POINT_RU, SIGN_RU, PLANETS, fmtDeg, type Planet} from './engine/astro';
import {CENTERS, CENTER_RU, HD_BODY_RU, TYPE_RU} from './engine/hd';
import {PY_LINES} from './engine/numbers';
import {ANIMAL_RU, BRANCH_HAN, ELEMENTS, ELEMENT_RU, STEM_HAN, pillarRu} from './engine/bazi';
import {Bodygraph, MatrixChart, NatalWheel, PythagorasGrid} from './charts';
import {paras, typo} from './format';
import {go} from './App';

type P = {calc: Calc; lib: Library; route: Route};

/* ───── общие блоки ───── */
export function Section({id, title, lead, children}: {id: string; title: string; lead?: string; children: ReactNode}) {
  return (
    <section className="sec" aria-labelledby={`h-${id}`}>
      <VStack gap={2} className="sec__head">
        <Heading level={2} id={`h-${id}`} type="display-3" textWrap="balance">{title}</Heading>
        {lead && <Text type="large" color="secondary" textWrap="pretty">{typo(lead)}</Text>}
      </VStack>
      {children}
    </section>
  );
}

function Paras({text}: {text: string}) {
  return <>{paras(text).map((p, i) => <Text key={i} as="p" textWrap="pretty" className="para">{p}</Text>)}</>;
}

function DoDont({d, n}: {d?: string[]; n?: string[]}) {
  if (!d?.length && !n?.length) return null;
  return (
    <HStack gap={4} wrap="wrap" className="dd" vAlign="start">
      {d?.length ? (
        <VStack gap={1} className="dd__col">
          <Text size="sm" weight="semibold" className="dd__do">Делать</Text>
          <ul className="dd__list is-do">{d.map((t) => <li key={t}>{typo(t)}</li>)}</ul>
        </VStack>
      ) : null}
      {n?.length ? (
        <VStack gap={1} className="dd__col">
          <Text size="sm" weight="semibold" className="dd__dont">Не делать</Text>
          <ul className="dd__list is-dont">{n.map((t) => <li key={t}>{typo(t)}</li>)}</ul>
        </VStack>
      ) : null}
    </HStack>
  );
}

export function EntryBlock({kicker, e, hideDo}: {kicker?: string; e?: Partial<Entry> & {text: string}; hideDo?: boolean}) {
  if (!e) return null;
  return (
    <article className="entry">
      <VStack gap={2}>
        {kicker && <Text size="sm" color="secondary" className="entry__kicker">{kicker}</Text>}
        {e.title && <Heading level={3} textWrap="balance">{e.title}</Heading>}
        {e.short && <Text type="large" className="entry__short" textWrap="pretty">{typo(e.short)}</Text>}
        <Paras text={e.text} />
        {!hideDo && <DoDont d={e.do} n={e.dont} />}
      </VStack>
    </article>
  );
}

function Facts({rows}: {rows: [string, ReactNode][]}) {
  return (
    <dl className="facts">
      {rows.map(([k, v]) => (
        <div key={k} className="facts__row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ───── Маршрут ───── */
export function RouteSection({calc, route, id}: P & {id: string}) {
  const spheres = Object.keys(SPHERE_RU) as Sphere[];
  return (
    <VStack gap={10}>
      <section className="pass" aria-label="Главное">
        <VStack gap={3}>
          <Text className="pass__kicker">{route.subtitle}</Text>
          <Heading level={2} type="display-1" className="pass__title">{route.title}</Heading>
          <Text type="large" className="pass__rule" textWrap="pretty">
            {route.strategy}. {route.rule}.
          </Text>
          <HStack gap={6} wrap="wrap" className="pass__meta">
            <VStack gap={0.5}><Text size="sm" className="pass__dim">Когда всё правильно</Text><Text weight="semibold">{route.signature}</Text></VStack>
            <VStack gap={0.5}><Text size="sm" className="pass__dim">Сигнал, что свернули не туда</Text><Text weight="semibold">{route.notself}</Text></VStack>
            <VStack gap={0.5}><Text size="sm" className="pass__dim">{route.yearFocus.title}</Text><Text weight="semibold" textWrap="pretty">{typo(route.yearFocus.short)}</Text></VStack>
          </HStack>
        </VStack>
        <Button label="Сделать обои с маршрутом" variant="secondary" icon={<PhotoIcon />} onClick={() => go(`/r/${id}/wall`)} className="pass__btn no-print" />
      </section>

      <section className="twin" aria-label="Делать и не делать">
        <VStack gap={3} className="twin__col">
          <Heading level={2} type="display-3">Делать</Heading>
          <ol className="steps is-do">
            {route.doTop.slice(0, 7).map((i) => (
              <li key={i.text}><Text type="large" weight="semibold">{typo(i.text)}</Text><Text size="sm" color="secondary">{i.source}</Text></li>
            ))}
          </ol>
        </VStack>
        <VStack gap={3} className="twin__col">
          <Heading level={2} type="display-3">Не делать</Heading>
          <ol className="steps is-dont">
            {route.dontTop.map((i) => (
              <li key={i.text}><Text type="large" weight="semibold">{typo(i.text)}</Text><Text size="sm" color="secondary">{i.source}</Text></li>
            ))}
          </ol>
        </VStack>
      </section>

      <Section id="scen" title="Сценарии, которые повторяются" lead="Где человек снова и снова попадает в одну и ту же ситуацию, и как из неё выходить.">
        <ol className="scen">
          {route.scenarios.map((s) => (
            <li key={s.title} className="scen__item">
              <Text size="sm" color="secondary">{s.source}</Text>
              <Heading level={3}>{s.title}</Heading>
              <VStack gap={0.5}><Text size="sm" className="scen__lbl is-repeat">Повторяется</Text><Text textWrap="pretty">{typo(s.repeat)}</Text></VStack>
              <VStack gap={0.5}><Text size="sm" className="scen__lbl is-exit">Выход</Text><Text textWrap="pretty" weight="semibold">{typo(s.exit)}</Text></VStack>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="daily" title="Каждый день" lead="Короткий ритуал, который держит человека в своей системе.">
        <ol className="daily">
          {route.daily.map((t) => <li key={t}><Text type="large">{typo(t)}</Text></li>)}
        </ol>
      </Section>

      <Section id="plan" title="Маршрут на 90 дней" lead="Три шага по месяцу. Следующий начинается, когда предыдущий стал привычкой.">
        <ol className="plan">
          {route.steps.map((s) => (
            <li key={s.title} className="plan__step">
              <Text size="sm" weight="semibold" className="plan__days">{s.days}</Text>
              <Heading level={3}>{s.title}</Heading>
              <Text color="secondary" textWrap="pretty">{typo(s.why)}</Text>
              <ul className="dd__list is-do">{s.actions.map((a) => <li key={a}>{typo(a)}</li>)}</ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="spheres" title="По сферам жизни">
        <VStack gap={6}>
          {spheres.map((s) => (route.doAll[s].length || route.dontAll[s].length ? (
            <VStack key={s} gap={2} className="sphere">
              <Heading level={3}>{SPHERE_RU[s]}</Heading>
              <DoDont d={route.doAll[s].map((i) => i.text)} n={route.dontAll[s].map((i) => i.text)} />
            </VStack>
          ) : null))}
        </VStack>
      </Section>
      {!calc.timeKnown && <TimeBanner />}
    </VStack>
  );
}

function TimeBanner() {
  return (
    <Banner
      status="warning"
      title="Время рождения неизвестно"
      description="Дома, асцендент, MC и аспекты Луны не считаются, Луна и бодиграф посчитаны на 12:00. Если узнаете время, нажмите «Изменить данные»."
    />
  );
}

/* ───── Астрология ───── */
export function AstroSection({calc, lib}: P) {
  const n = calc.natal;
  const by = (id: string) => n.placements.find((p) => p.id === id);
  const order = ['sun', 'moon', 'asc', 'mc', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'node', 'uranus', 'neptune', 'pluto'];
  const total = Object.values(n.elements).reduce((s, x) => s + x, 0) || 1;
  const EL: Record<string, string> = {fire: 'Огонь', earth: 'Земля', air: 'Воздух', water: 'Вода'};
  const aspects = n.aspects.filter((a) => a.type !== 'conjunction' || true).slice(0, 10);
  return (
    <VStack gap={10}>
      {!calc.timeKnown && <TimeBanner />}
      <section className="chart-row">
        <figure className="chart-fig"><NatalWheel chart={n} size={460} /></figure>
        <VStack gap={4} className="chart-side">
          <table className="tbl">
            <caption className="sr-only">Положения планет</caption>
            <thead><tr><th scope="col">Планета</th><th scope="col">Знак</th><th scope="col">Градус</th>{calc.timeKnown && <th scope="col">Дом</th>}</tr></thead>
            <tbody>
              {order.map((id) => {
                const p = by(id);
                if (!p) return null;
                return (
                  <tr key={id}>
                    <td><span className="glyph" aria-hidden>{POINT_GLYPH[p.id]}</span> {POINT_RU[p.id]}{p.retro ? ' R' : ''}</td>
                    <td>{SIGN_RU[p.sign]}</td>
                    <td className="num">{fmtDeg(p.lon)}</td>
                    {calc.timeKnown && <td className="num">{p.house}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <VStack gap={2}>
            <Text weight="semibold">Баланс стихий</Text>
            {Object.entries(n.elements).map(([k, v]) => (
              <HStack key={k} gap={3} vAlign="center">
                <Text className="bar-lbl">{EL[k]}</Text>
                <span className={`meter el-${k}`} style={{['--w' as string]: `${(v / total) * 100}%`}} aria-label={`${EL[k]}: ${Math.round((v / total) * 100)}%`} />
              </HStack>
            ))}
          </VStack>
          {calc.timeKnown && n.houseSystem === 'porphyry' && <Text size="sm" color="secondary">За полярным кругом дома Плацидуса не строятся, использован Порфирий.</Text>}
        </VStack>
      </section>

      <Section id="planets" title="Планеты в знаках" lead="Ядро характера, эмоции, мышление, любовь, действие и большие циклы.">
        <VStack gap={8}>
          {order.map((id) => {
            const p = by(id);
            if (!p) return null;
            if (!calc.timeKnown && id === 'moon') {
              return <EntryBlock key={id} kicker="Луна (без точного времени знак может отличаться)" e={lib.signs.moon?.[p.sign]} />;
            }
            return <EntryBlock key={id} kicker={`${POINT_RU[p.id]}: ${SIGN_RU[p.sign]}, ${fmtDeg(p.lon)}${p.house ? `, ${p.house} дом` : ''}`} e={lib.signs[id]?.[p.sign]} />;
          })}
        </VStack>
      </Section>

      {calc.timeKnown && lib.houses && (
        <Section id="houses" title="Планеты в домах" lead="Дом показывает сферу жизни, где планета работает сильнее всего.">
          <VStack gap={8}>
            {PLANETS.map((id) => {
              const p = by(id);
              if (!p?.house) return null;
              const h = lib.houses!.houses[String(p.house)];
              return <EntryBlock key={id} kicker={h?.title} e={lib.houses!.planets[id]?.[String(p.house)]} />;
            })}
          </VStack>
        </Section>
      )}

      {lib.houses && aspects.length > 0 && (
        <Section id="aspects" title="Главные аспекты" lead="Связи между планетами: где силы помогают друг другу, а где спорят.">
          <VStack gap={6}>
            {aspects.map((a) => {
              const pair = lib.houses!.aspects.pairs[`${a.a}-${a.b}`];
              const t = lib.houses!.aspects.types[a.type];
              if (!pair || !t) return null;
              const tense = a.type === 'square' || a.type === 'opposition';
              return (
                <article key={`${a.a}${a.b}`} className="entry">
                  <VStack gap={2}>
                    <Text size="sm" color="secondary">{t.title}, орбис {a.orb.toFixed(1)}°</Text>
                    <Heading level={3}>{POINT_RU[a.a as Planet]} и {POINT_RU[a.b as Planet].toLowerCase()}</Heading>
                    <Text as="p" textWrap="pretty" className="para">{typo(tense ? pair.tense : pair.harmonious)}</Text>
                    {tense && <DoDont d={pair.do} n={pair.dont} />}
                  </VStack>
                </article>
              );
            })}
          </VStack>
        </Section>
      )}
    </VStack>
  );
}

/* ───── Дизайн человека ───── */
export function HdSection({calc, lib}: P) {
  const h = calc.hd;
  const t = lib.hd.types[h.type];
  const [pl, dl] = h.profile.split('/');
  const crossName = {right: 'Правоугольный крест', juxtaposition: 'Джакстапозиционный крест', left: 'Левоугольный крест'}[h.angle];
  return (
    <VStack gap={10}>
      {!calc.timeKnown && <TimeBanner />}
      <section className="chart-row">
        <figure className="chart-fig chart-fig--bg">
          <Bodygraph hd={h} size={320} />
          <figcaption className="legend">
            <span className="legend__p">Личность (сознательное)</span>
            <span className="legend__d">Дизайн (бессознательное)</span>
          </figcaption>
        </figure>
        <VStack gap={5} className="chart-side">
          <Facts rows={[
            ['Тип', TYPE_RU[h.type]],
            ['Стратегия', t.strategy],
            ['Авторитет', AUTH_RU[h.authority]],
            ['Профиль', `${h.profile}, ${lib.hd.lines[pl]?.title.split('. ')[1] ?? ''} и ${lib.hd.lines[dl]?.title.split('. ')[1]?.toLowerCase() ?? ''}`],
            ['Определённость', lib.hd.definitions[h.definition]?.title ?? h.definition],
            ['Подпись', t.signature],
            ['Тема не-себя', t.notself],
            ['Инкарнационный крест', `${crossName} ${h.cross[0]}/${h.cross[1]} | ${h.cross[2]}/${h.cross[3]}`],
          ]} />
          <table className="tbl tbl--act">
            <caption className="sr-only">Активации</caption>
            <thead><tr><th scope="col" className="is-d">Дизайн</th><th scope="col"></th><th scope="col" className="is-p">Личность</th></tr></thead>
            <tbody>
              {h.personality.map((a, i) => (
                <tr key={a.body}>
                  <td className="num is-d">{h.design[i].gate}.{h.design[i].line}</td>
                  <td className="act-body">{HD_BODY_RU[a.body]}</td>
                  <td className="num is-p">{a.gate}.{a.line}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </VStack>
      </section>

      <Section id="type" title="Тип и стратегия">
        <VStack gap={8}>
          <EntryBlock e={t} />
          <EntryBlock kicker="Как принимать решения" e={lib.hd.authorities[h.authority]} />
        </VStack>
      </Section>

      <Section id="profile" title="Профиль" lead="Роль в жизни: как человек учится и как его видят другие.">
        <EntryBlock e={lib.hd.profiles[h.profile]} />
      </Section>

      <Section id="centers" title="Центры" lead={`Определено ${h.defined.size} из 9. Определённые центры дают постоянную энергию, открытые впитывают чужую и учат мудрости.`}>
        <VStack gap={8}>
          {CENTERS.map((c) => {
            const ce = lib.hd.centers[c];
            const on = h.defined.has(c);
            return <EntryBlock key={c} kicker={`${CENTER_RU[c]}: ${on ? 'определён' : 'открыт'}`} e={on ? ce?.defined : ce?.open} />;
          })}
        </VStack>
      </Section>

      {h.channels.length > 0 && (
        <Section id="channels" title="Каналы" lead="Постоянные таланты: то, что у человека работает всегда, без усилия.">
          <VStack gap={8}>{h.channels.map((ch) => <EntryBlock key={ch} e={lib.hd.channels[ch]} />)}</VStack>
        </Section>
      )}

      <Section id="gates" title="Ворота" lead="Отдельные темы, активированные планетами. Сначала Солнце и Земля, они главные.">
        <VStack gap={8}>
          {[...new Map([...h.personality, ...h.design].map((a) => [a.gate, a])).values()].map((a) => {
            const st = h.gates.get(a.gate)!;
            const who = st.p && st.d ? 'Личность и Дизайн' : st.p ? 'Личность' : 'Дизайн';
            return <EntryBlock key={a.gate} kicker={`${HD_BODY_RU[a.body]}, ${who}`} e={lib.hd.gates[String(a.gate)]} />;
          })}
        </VStack>
      </Section>

      <Section id="cross" title="Инкарнационный крест">
        <EntryBlock e={{...lib.hd.angles[h.angle], text: `${lib.hd.angles[h.angle]?.text ?? ''}\n\nВорота креста: Солнце Личности ${h.cross[0]}, Земля Личности ${h.cross[1]}, Солнце Дизайна ${h.cross[2]}, Земля Дизайна ${h.cross[3]}.`}} />
      </Section>
    </VStack>
  );
}

/* ───── Матрица судьбы ───── */
export function MatrixSection({calc, lib}: P) {
  const m = calc.matrix;
  const a = (n: number) => lib.matrix[String(n)];
  return (
    <VStack gap={10}>
      <section className="chart-row">
        <figure className="chart-fig"><MatrixChart m={m} size={400} /></figure>
        <VStack gap={4} className="chart-side">
          <Facts rows={[
            ['Личность', `${m.A}, ${a(m.A)?.name}`],
            ['Талант от рождения', `${m.B}, ${a(m.B)?.name}`],
            ['Зона комфорта', `${m.E}, ${a(m.E)?.name}`],
            ['Кармический хвост', m.tail.join('-')],
            ['Денежный канал', `${m.money}, ${a(m.money)?.name}`],
            ['Канал отношений', `${m.love}, ${a(m.love)?.name}`],
            ['Личное предназначение', `${m.personal}, ${a(m.personal)?.name}`],
            ['Социальное', `${m.social}, ${a(m.social)?.name}`],
            ['Духовное', `${m.spiritual}, ${a(m.spiritual)?.name}`],
          ]} />
        </VStack>
      </section>
      <Section id="mx-person" title="Личность">
        <VStack gap={8}>
          <EntryBlock e={a(m.A)?.personality} />
          <VStack gap={2}><Text size="sm" color="secondary">В плюсе и в минусе</Text>
            <Text textWrap="pretty"><b>Плюс.</b> {typo(a(m.A)?.plus ?? '')}</Text>
            <Text textWrap="pretty"><b>Минус.</b> {typo(a(m.A)?.minus ?? '')}</Text>
          </VStack>
        </VStack>
      </Section>
      <Section id="mx-talent" title="Таланты">
        <VStack gap={6}>
          {m.talent.map((n, i) => (
            <EntryBlock key={i} kicker={['Главный талант', 'Талант через опыт', 'Талант через практику'][i]} e={{title: `Аркан ${n}. ${a(n)?.name}`, short: a(n)?.talent.short, text: a(n)?.talent.text ?? ''}} />
          ))}
        </VStack>
      </Section>
      <Section id="mx-tail" title={`Кармический хвост ${m.tail.join('-')}`} lead="Программа, с которой человек пришёл. Пока её не видно, она разыгрывается снова и снова.">
        <EntryBlock e={{title: a(m.tail[0])?.tail.title, text: `${a(m.tail[0])?.tail.text ?? ''}\n\nПовторяется: ${a(m.tail[0])?.tail.scenario ?? ''}.\n\nВыход: ${a(m.tail[0])?.tail.exit ?? ''}.`}} />
      </Section>
      <Section id="mx-money" title={`Деньги: аркан ${m.money}, ${a(m.money)?.name}`}>
        <EntryBlock e={a(m.money)?.money} />
      </Section>
      <Section id="mx-love" title={`Отношения: аркан ${m.love}, ${a(m.love)?.name}`}>
        <EntryBlock e={a(m.love)?.love} />
      </Section>
      <Section id="mx-purpose" title="Предназначение" lead="Три уровня: до 40 лет личное, с 40 социальное, после 60 духовное.">
        <VStack gap={6}>
          {([['Личное', m.personal], ['Социальное', m.social], ['Духовное', m.spiritual]] as const).map(([k, n]) => (
            <EntryBlock key={k} kicker={k} e={{title: `Аркан ${n}. ${a(n)?.name}`, text: a(n)?.purpose.text ?? ''}} />
          ))}
        </VStack>
      </Section>
      <Section id="mx-health" title="Здоровье" lead="На что обратить внимание. Это не диагноз и не замена врачу.">
        <EntryBlock e={{title: `Аркан ${m.E}. ${a(m.E)?.name}`, text: a(m.E)?.health.text ?? ''}} />
      </Section>
    </VStack>
  );
}

/* ───── Числа ───── */
export function NumbersSection({calc, lib}: P) {
  const py = calc.py;
  const nm = calc.name;
  const level = (n: number) => String(Math.min(n, 5));
  const lineLevel = (n: number) => (n <= 2 ? 'low' : n <= 5 ? 'mid' : 'high');
  return (
    <VStack gap={10}>
      <section className="chart-row">
        <figure className="chart-fig"><PythagorasGrid cells={py.cells} /></figure>
        <VStack gap={4} className="chart-side">
          <Facts rows={[
            ['Рабочие числа', py.working.join(', ')],
            ['Число пути', String(calc.lifePath)],
            [`Личный год ${calc.year}`, String(calc.personalYear)],
            ...(nm ? ([['Число выражения', String(nm.expression)], ['Число души', String(nm.soul)], ['Число личности', String(nm.personality)]] as [string, string][]) : []),
          ]} />
        </VStack>
      </section>
      <Section id="lifepath" title="Число жизненного пути" lead="Сумма всех цифр даты рождения: главная тема жизни и способ, которым человеку легче всего двигаться.">
        <EntryBlock e={lib.numbers.lifepath[String(calc.lifePath)]} />
      </Section>
      <Section id="pyear" title={`Личный год, ${calc.year}`} lead="Цикл из девяти лет. Подсказывает, на что ставить в этом году.">
        <EntryBlock e={lib.numbers.personalYear[String(calc.personalYear)]} />
      </Section>
      <Section id="py" title="Квадрат Пифагора" lead="Сколько раз цифра встречается в дате и рабочих числах. Чем больше, тем сильнее качество.">
        <VStack gap={6}>
          {Array.from({length: 9}, (_, i) => i + 1).map((d) => {
            const c = lib.numbers.pythagoras.cells[String(d)];
            const l = c?.levels[level(py.cells[d])];
            return <EntryBlock key={d} kicker={`Цифра ${d}: ${py.cells[d] ? String(d).repeat(py.cells[d]) : 'нет'}`} e={l ? {title: c.title, short: l.short, text: l.text} : undefined} />;
          })}
        </VStack>
      </Section>
      <Section id="pylines" title="Линии квадрата">
        <VStack gap={6}>
          {Object.keys(PY_LINES).map((k) => {
            const ln = lib.numbers.pythagoras.lines[k];
            if (!ln) return null;
            return <EntryBlock key={k} kicker={`Цифр в линии: ${py.lines[k]}`} e={{title: ln.title, text: ln[lineLevel(py.lines[k])]}} />;
          })}
        </VStack>
      </Section>
      {nm && (
        <Section id="name" title="Числа имени" lead={`Посчитано по имени «${calc.person.name}».`}>
          <VStack gap={6}>
            <EntryBlock kicker="Число выражения" e={{title: `Выражение ${nm.expression}`, ...lib.numbers.expression[String(nm.expression)]}} />
            <EntryBlock kicker="Число души" e={{title: `Душа ${nm.soul}`, ...lib.numbers.soul[String(nm.soul)]}} />
            <EntryBlock kicker="Число личности" e={{title: `Личность ${nm.personality}`, ...lib.numbers.personality[String(nm.personality)]}} />
          </VStack>
        </Section>
      )}
    </VStack>
  );
}

/* ───── Ба Цзы ───── */
export function EastSection({calc, lib}: P) {
  const b = calc.bazi;
  const pillars = [['Час', b.hour], ['День', b.day], ['Месяц', b.month], ['Год', b.year]] as const;
  const max = Math.max(...Object.values(b.counts), 1);
  return (
    <VStack gap={10}>
      <section className="pillars" aria-label="Четыре столпа">
        {pillars.map(([k, p]) => (
          <VStack key={k} gap={1} hAlign="center" className={`pillar${k === 'День' ? ' is-day' : ''}`}>
            <Text size="sm" color="secondary">{k}</Text>
            {p ? (
              <>
                <span className="pillar__han" lang="zh">{STEM_HAN[p.stem]}</span>
                <span className="pillar__han" lang="zh">{BRANCH_HAN[p.branch]}</span>
                <Text size="sm" justify="center" textWrap="balance">{pillarRu(p.stem, p.branch)}</Text>
              </>
            ) : <Text size="sm" color="secondary" justify="center">нужно время</Text>}
          </VStack>
        ))}
      </section>
      <VStack gap={2}>
        <Text weight="semibold">Стихии в карте</Text>
        {ELEMENTS.map((e) => (
          <HStack key={e} gap={3} vAlign="center">
            <Text className="bar-lbl">{ELEMENT_RU[e]}</Text>
            <span className={`meter wx-${e}`} style={{['--w' as string]: `${(b.counts[e] / max) * 100}%`}} />
            <Text className="num" size="sm">{b.counts[e]}</Text>
          </HStack>
        ))}
      </VStack>
      <Section id="dm" title="Хозяин дня" lead="Небесный ствол дня рождения. В Ба Цзы это сам человек.">
        <EntryBlock kicker={lib.east.stems[b.dayMaster]?.image} e={lib.east.stems[b.dayMaster]} />
      </Section>
      {(b.lack.length > 0 || b.excess.length > 0) && (
        <Section id="balance" title="Баланс стихий">
          <VStack gap={6}>
            {b.lack.map((e) => <EntryBlock key={`l${e}`} e={{title: `Не хватает стихии ${ELEMENT_RU[e]}`, ...lib.east.elements[e].lack}} />)}
            {b.excess.map((e) => <EntryBlock key={`x${e}`} e={{title: `Много стихии ${ELEMENT_RU[e]}`, ...lib.east.elements[e].excess}} />)}
          </VStack>
        </Section>
      )}
      <Section id="animal" title={`Год ${ANIMAL_RU[b.animal]}`} lead="Животное года по солнечному календарю: год меняется 4 февраля, а не в январе.">
        <EntryBlock e={lib.east.animals[b.animal]} />
      </Section>
    </VStack>
  );
}

/* ───── Генные ключи ───── */
export function KeysSection({calc, lib}: P) {
  const groups: [string, string, string[]][] = [
    ['Активация', 'Дело жизни и как в нём расти.', ['lifework', 'evolution', 'radiance', 'purpose']],
    ['Венера', 'Отношения и эмоциональные паттерны.', ['attraction', 'iq', 'eq', 'sq']],
    ['Жемчужина', 'Призвание и деньги.', ['vocation', 'culture', 'pearl']],
  ];
  return (
    <VStack gap={10}>
      {groups.map(([g, lead, keys]) => (
        <Section key={g} id={`gk-${g}`} title={`Последовательность «${g}»`} lead={lead}>
          <ol className="keys">
            {keys.map((k) => {
              const v = calc.hd.genekeys[k];
              const gk = lib.east.genekeys[String(v.gate)];
              const sp = lib.east.spheres[k];
              return (
                <li key={k} className="key">
                  <HStack gap={3} vAlign="end" justify="between" wrap="wrap">
                    <Heading level={3}>{sp?.title}</Heading>
                    <Text className="num key__n">{v.gate}.{v.line}</Text>
                  </HStack>
                  <Text size="sm" color="secondary" textWrap="pretty">{typo(sp?.short ?? '')}</Text>
                  <HStack gap={2} wrap="wrap" className="key__arc" vAlign="center">
                    <span className="key__shadow">{gk?.shadow}</span><span aria-hidden>→</span>
                    <span className="key__gift">{gk?.gift}</span><span aria-hidden>→</span>
                    <span className="key__siddhi">{gk?.siddhi}</span>
                  </HStack>
                  <Text textWrap="pretty">{typo(gk?.short ?? '')}</Text>
                </li>
              );
            })}
          </ol>
        </Section>
      ))}
      <Text size="sm" color="secondary">Тень — как ключ проявляется под давлением, Дар — в здоровом состоянии, Сиддхи — высшее проявление.</Text>
    </VStack>
  );
}
