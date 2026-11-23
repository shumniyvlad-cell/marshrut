// Главная: что умеет сервис, живое небо прямо сейчас и список клиентов эксперта.
import {useEffect, useMemo, useState} from 'react';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {List, ListItem} from '@astryxdesign/core/List';
import {ArrowRightIcon, PlusIcon, UserGroupIcon} from '@heroicons/react/24/outline';
import {natalChart, SIGN_RU} from './engine/astro';
import {NatalWheel} from './charts';
import {SAMPLE, store, useStore} from './store';
import {birthLine} from './format';
import {go} from './App';

const SYSTEMS = [
  ['Астрология', 'натальная карта, дома Плацидуса, аспекты'],
  ['Дизайн человека', 'тип, авторитет, профиль, бодиграф, каналы и ворота'],
  ['Матрица судьбы', '22 аркана, кармический хвост, деньги и любовь'],
  ['Квадрат Пифагора', 'психоматрица, линии и рабочие числа'],
  ['Нумерология', 'число пути, личный год, числа имени'],
  ['Ба Цзы', 'четыре столпа, хозяин дня, баланс стихий'],
  ['Генные ключи', 'тень, дар и сиддхи по 11 сферам'],
];

function useNow(ms: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function Home({onNew}: {onNew: () => void}) {
  const {people} = useStore();
  const now = useNow(60000);
  const sky = useMemo(() => natalChart(now, null, null, false), [now]);
  const moon = sky.placements.find((p) => p.id === 'moon')!;
  const sun = sky.placements.find((p) => p.id === 'sun')!;
  const retro = sky.placements.filter((p) => p.retro).length;

  const openSample = () => {
    if (!store.get().people.some((p) => p.id === SAMPLE.id)) store.save({...SAMPLE, createdAt: Date.now()});
    go(`/r/${SAMPLE.id}`);
  };

  return (
    <VStack gap={10} className="col col--wide" paddingBlockEnd={10}>
      <section className="hero">
        <VStack gap={5} className="hero__text">
          <Heading level={1} type="display-1" textWrap="balance">
            Полный разбор человека по&nbsp;дате рождения
          </Heading>
          <Text type="large" color="secondary" textWrap="pretty">
            Вбиваете дату, время и&nbsp;место. Получаете астрологию, Дизайн человека, Матрицу судьбы, Пифагора,
            нумерологию, Ба&nbsp;Цзы и&nbsp;Генные ключи в&nbsp;одном отчёте, а&nbsp;из&nbsp;них маршрут: что делать,
            что не&nbsp;делать, какой сценарий повторяется. И&nbsp;обои на&nbsp;рабочий стол с&nbsp;этим планом.
          </Text>
          <HStack gap={3} wrap="wrap">
            <Button label="Новый разбор" variant="primary" size="lg" icon={<PlusIcon />} onClick={onNew} />
            <Button label="Посмотреть пример" variant="secondary" size="lg" onClick={openSample} />
          </HStack>
        </VStack>
        <figure className="hero__sky" aria-label="Небо прямо сейчас">
          <NatalWheel chart={sky} size={420} />
          <figcaption>
            <Text size="sm" color="secondary" textWrap="pretty">
              Небо сейчас: Солнце в знаке {SIGN_RU[sun.sign]}, Луна в знаке {SIGN_RU[moon.sign]}
              {retro ? `, ретроградных планет: ${retro}` : ''}. Считается в браузере, обновляется каждую минуту.
            </Text>
          </figcaption>
        </figure>
      </section>

      <section aria-labelledby="people">
        <HStack justify="between" vAlign="end" gap={3} wrap="wrap">
          <Heading level={2} id="people">Клиенты</Heading>
          {people.length > 0 && <Text color="secondary" hasTabularNumbers>{people.length} в списке</Text>}
        </HStack>
        {people.length === 0 ? (
          <EmptyState
            icon={<UserGroupIcon />}
            title="Здесь будут ваши клиенты"
            description="Каждый разбор сохраняется в этом браузере. Начните с себя или откройте пример."
            actions={
              <HStack gap={2} wrap="wrap" justify="center">
                <Button label="Новый разбор" variant="primary" onClick={onNew} />
                <Button label="Открыть пример" variant="secondary" onClick={openSample} />
              </HStack>
            }
          />
        ) : (
          <List hasDividers edge="outset">
            {people.map((p) => (
              <ListItem
                key={p.id}
                itemKey={p.id}
                label={p.name}
                description={<Text color="secondary" hasTabularNumbers>{birthLine(p)}</Text>}
                onClick={() => go(`/r/${p.id}`)}
                endContent={<ArrowRightIcon className="li-arrow" aria-hidden />}
              />
            ))}
          </List>
        )}
      </section>

      <section aria-labelledby="systems" className="systems">
        <Heading level={2} id="systems">Что внутри разбора</Heading>
        <ol className="systems__list">
          {SYSTEMS.map(([t, d], i) => (
            <li key={t}>
              <span className="systems__n">{String(i + 1).padStart(2, '0')}</span>
              <Text weight="semibold" type="large">{t}</Text>
              <Text color="secondary">{d}</Text>
            </li>
          ))}
          <li className="systems__route">
            <span className="systems__n">→</span>
            <Text weight="semibold" type="large">Маршрут и обои</Text>
            <Text color="secondary">7 действий «делать», 7 «не делать», повторяющиеся сценарии, план на 90 дней</Text>
          </li>
        </ol>
      </section>
    </VStack>
  );
}
