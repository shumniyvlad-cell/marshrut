// Краткий разбор «для клиента»: пять показателей, конфликт, точка А и Б, маршрутный лист, делать / не делать, обои.
// Язык человеческий, без терминов систем; на печати — отдельный PDF.
import {useEffect, useMemo, useRef} from 'react';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {ArrowRightIcon, PhotoIcon} from '@heroicons/react/24/outline';
import type {Calc, Person} from './engine';
import type {Route} from './engine/route';
import {buildBrief} from './engine/brief';
import {drawWall, ensureFonts} from './wall';
import {typo} from './format';
import {go} from './App';

export function BriefSection({person, calc, route}: {person: Person; calc: Calc; route: Route}) {
  const b = useMemo(() => buildBrief(person, route), [person, route]);
  const phone = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    ensureFonts().then(() => {
      if (live && phone.current) drawWall(phone.current, route, calc.natal, person.name, person.y * 10000 + person.m * 100 + person.d, {format: 'phone', theme: 'night', count: 5, scenario: false, signature: ''});
    });
    return () => { live = false; };
  }, [route, calc, person]);

  return (
    <VStack gap={10} className="brief">
      <section className="sec" aria-labelledby="h-five">
        <VStack gap={2} className="sec__head">
          <Heading level={2} id="h-five" type="display-3" textWrap="balance">Пять показателей</Heading>
          <Text type="large" color="secondary" textWrap="pretty">
            {typo('Сильные стороны, слепые зоны и стратегия на текущий год. Без мистики: на языке системного анализа и кризис-менеджмента.')}
          </Text>
        </VStack>
        <ol className="bcards">
          {b.cards.map((c) => (
            <li key={c.key} className={`bcard bcard--${c.key}`}>
              <span className="bcard__n" aria-hidden>{c.n}</span>
              <VStack gap={2}>
                <Heading level={3} textWrap="balance">{c.title}</Heading>
                <Text weight="semibold" className="bcard__core">{c.core}</Text>
                <Text size="sm" color="secondary" textWrap="pretty">{typo(c.what)}</Text>
                <dl className="bcard__rows">
                  {c.rows.map((r) => (
                    <div key={r.label} className={`bcard__row${r.tone === 'bug' ? ' is-bug' : ''}`}>
                      <dt>{r.label}</dt>
                      <dd>{typo(r.text)}</dd>
                    </div>
                  ))}
                </dl>
              </VStack>
            </li>
          ))}
        </ol>
      </section>

      {b.conflict && (
        <section className="conflict dark-zone" aria-labelledby="h-conflict">
          <VStack gap={3}>
            <Text className="kicker">Точка сбоя</Text>
            <Heading level={2} id="h-conflict" type="display-3" className="conflict__h" textWrap="balance">Главный внутренний конфликт</Heading>
            <Text type="large" className="conflict__text" textWrap="pretty">{typo(b.conflict.text)}</Text>
            <VStack gap={0.5} className="conflict__exit">
              <Text size="sm" className="conflict__lbl">Стратегия</Text>
              <Text weight="semibold" textWrap="pretty">{typo(b.conflict.exit)}</Text>
            </VStack>
          </VStack>
        </section>
      )}

      {(b.from || b.to) && (
        <section className="sec" aria-labelledby="h-ab">
          <Heading level={2} id="h-ab" type="display-3">Твой маршрут</Heading>
          <div className="ab">
            {b.from && <VStack gap={1} className="ab__pt"><Text size="sm" weight="semibold" className="ab__lbl">Точка А · где ты сейчас</Text><Text type="large" textWrap="pretty">{typo(b.from)}</Text></VStack>}
            {b.from && b.to && <ArrowRightIcon className="ab__arrow" aria-hidden />}
            {b.to && <VStack gap={1} className="ab__pt is-to"><Text size="sm" weight="semibold" className="ab__lbl">Точка Б · куда идёшь</Text><Text type="large" textWrap="pretty">{typo(b.to)}</Text></VStack>}
          </div>
        </section>
      )}

      <section className="sec" aria-labelledby="h-sheet">
        <VStack gap={2} className="sec__head">
          <Heading level={2} id="h-sheet" type="display-3">Твой маршрутный лист</Heading>
          <Text type="large" color="secondary" textWrap="pretty">Три действия, с которых начинается движение. По одному на каждую зону.</Text>
        </VStack>
        <ol className="steps is-do sheet">
          {b.sheet.map((s) => (
            <li key={s.text}><Text size="sm" color="secondary">{s.label}</Text><Text type="large" weight="semibold">{typo(s.text)}</Text></li>
          ))}
        </ol>
      </section>

      <section className="twin" aria-label="Делать и не делать">
        <VStack gap={3} className="twin__col">
          <Heading level={2} type="display-3">Делать</Heading>
          <ol className="steps is-do">{b.doList.map((t) => <li key={t}><Text type="large" weight="semibold">{typo(t)}</Text></li>)}</ol>
        </VStack>
        <VStack gap={3} className="twin__col">
          <Heading level={2} type="display-3">Не делать</Heading>
          <ol className="steps is-dont">{b.dontList.map((t) => <li key={t}><Text type="large" weight="semibold">{typo(t)}</Text></li>)}</ol>
        </VStack>
      </section>

      <section className="bwall no-print" aria-labelledby="h-bwall">
        <VStack gap={3} className="bwall__text">
          <Heading level={2} id="h-bwall" type="display-3">Обои на экран</Heading>
          <Text type="large" color="secondary" textWrap="pretty">План перед глазами каждый день: что делать и чего не делать. На телефон и компьютер.</Text>
          <HStack gap={3} wrap="wrap"><Button label="Сделать обои" variant="primary" icon={<PhotoIcon />} onClick={() => go(`/r/${person.id}/wall`)} /></HStack>
        </VStack>
        <figure className="bwall__phone"><canvas ref={phone} role="img" aria-label="Пример обоев на телефон" /></figure>
      </section>

      <Text size="sm" color="secondary" textWrap="pretty">
        Это базовый срез по дате рождения и имени. Точную сборку под твой запрос делает специалист на личной встрече.
      </Text>
    </VStack>
  );
}
