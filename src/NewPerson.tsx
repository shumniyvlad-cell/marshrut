// Лист «Новый разбор»: имя, дата, время, место. Место ищем по названию и сразу берём часовой пояс.
import {useEffect, useRef, useState} from 'react';
import {BottomSheet} from '@astryxdesign/core/BottomSheet';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {TextArea} from '@astryxdesign/core/TextArea';
import {Switch} from '@astryxdesign/core/Switch';
import {Button} from '@astryxdesign/core/Button';
import {MapPinIcon} from '@heroicons/react/24/outline';
import type {Person, Place} from './engine';
import {offlineSearch, searchPlace} from './geo';
import {newId, store} from './store';
import {useSheetBack} from './useSheetBack';
import {pad} from './format';

const maskDate = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('.');
};
const maskTime = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
};

type Search = {kind: 'idle'} | {kind: 'loading'} | {kind: 'error'; list: Place[]} | {kind: 'ready'; list: Place[]};

export function NewPerson({isOpen, person, onClose, onSaved}: {
  isOpen: boolean; person: Person | null; onClose: () => void; onSaved: (p: Person) => void;
}) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [noTime, setNoTime] = useState(false);
  const [placeQ, setPlaceQ] = useState('');
  const [place, setPlace] = useState<Place | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState<Search>({kind: 'idle'});
  const [retry, setRetry] = useState(0);
  const [touched, setTouched] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  useSheetBack(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setTouched(false);
    setName(person?.name ?? '');
    setDate(person ? `${pad(person.d)}.${pad(person.m)}.${person.y}` : '');
    setTime(person && person.h !== null ? `${pad(person.h)}:${pad(person.min ?? 0)}` : '');
    setNoTime(person ? person.h === null : false);
    setPlace(person?.place ?? null);
    setPlaceQ(person?.place?.name ?? '');
    setFrom(person?.from ?? '');
    setTo(person?.to ?? '');
    setSearch({kind: 'idle'});
  }, [isOpen, person]);

  // поиск места с паузой после ввода
  useEffect(() => {
    const q = placeQ.trim();
    if (!isOpen || q.length < 2 || (place && place.name === placeQ)) { if (q.length < 2) setSearch({kind: 'idle'}); return; }
    const ctl = new AbortController();
    setSearch({kind: 'loading'});
    const t = setTimeout(() => {
      searchPlace(q, ctl.signal)
        .then((list) => setSearch({kind: 'ready', list: list.length ? list : offlineSearch(q)}))
        .catch((e) => { if ((e as Error).name !== 'AbortError') setSearch({kind: 'error', list: offlineSearch(q)}); });
    }, 300);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [placeQ, isOpen, place, retry]);

  const [dd, mm, yy] = date.split('.').map(Number);
  const dateOk = date.length === 10 && yy >= 1900 && yy <= 2100 && mm >= 1 && mm <= 12 && dd >= 1 && dd <= new Date(yy, mm, 0).getDate();
  const [th, tm] = time.split(':').map(Number);
  const timeOk = noTime || (time.length === 5 && th <= 23 && tm <= 59);
  const errors = {
    name: name.trim().length < 2 ? 'Напишите имя: по полному имени считаются числа имени' : '',
    date: dateOk ? '' : 'Нужна дата в виде 12.05.1990',
    time: timeOk ? '' : 'Время в виде 08:40. Если неизвестно, включите переключатель ниже',
    place: place ? '' : 'Выберите город из подсказок: от него зависят дома и часовой пояс',
  };

  const save = () => {
    setTouched(true);
    const first = (['name', 'date', 'time', 'place'] as const).find((k) => errors[k]);
    if (first) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLInputElement>(`input[name="${first}"]`)?.focus());
      return;
    }
    const p: Person = {
      id: person?.id ?? newId(),
      name: name.trim().replace(/\s+/g, ' '),
      y: yy, m: mm, d: dd,
      h: noTime ? null : th, min: noTime ? null : tm,
      place,
      ...(from.trim() ? {from: from.trim()} : {}),
      ...(to.trim() ? {to: to.trim()} : {}),
      createdAt: person?.createdAt ?? Date.now(),
    };
    store.save(p);
    onSaved(p);
  };

  const err = (k: keyof typeof errors) => (touched && errors[k] ? {status: {type: 'error' as const, message: errors[k]}} : {});

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(o) => !o && onClose()} label={person ? 'Изменить данные' : 'Новый разбор'} purpose="form" height="capped">
      <form ref={form} onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <VStack gap={5} padding={1}>
          <VStack gap={1}>
            <Heading level={2}>{person ? 'Изменить данные' : 'Новый разбор'}</Heading>
            <Text color="secondary" textWrap="pretty">Точное время и место дают дома, асцендент и точный бодиграф. Без времени разбор тоже соберётся, но короче.</Text>
          </VStack>
          <TextInput htmlName="name" label="Имя и фамилия" value={name} onChange={setName} placeholder="Анна Соколова" description="Полное имя, а не сокращённое: Владислав, а не Влад" {...err('name')} />
          <HStack gap={3} vAlign="start" wrap="wrap">
            <VStack className="grow">
              <TextInput htmlName="date" label="Дата рождения" value={date} onChange={(v) => setDate(maskDate(v))} placeholder="12.05.1990" inputMode="numeric" {...err('date')} />
            </VStack>
            <VStack className="grow">
              <TextInput htmlName="time" label="Время" value={noTime ? '' : time} onChange={(v) => setTime(maskTime(v))} placeholder="08:40" inputMode="numeric" isDisabled={noTime} {...err('time')} />
            </VStack>
          </HStack>
          <Switch label="Время рождения неизвестно" value={noTime} onChange={setNoTime} />
          <VStack gap={2}>
            <TextInput
              htmlName="place" label="Место рождения" value={placeQ} type="search"
              onChange={(v) => { setPlaceQ(v); if (place && v !== place.name) setPlace(null); }}
              placeholder="Начните вводить город" isLoading={search.kind === 'loading'} {...err('place')}
              description={place ? `Часовой пояс ${place.tz}, ${place.lat.toFixed(2)}°, ${place.lon.toFixed(2)}°` : undefined}
            />
            {search.kind === 'error' && (
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Text size="sm" color="secondary">Поиск городов не ответил{search.list.length ? ', показываю из своего списка' : ''}.</Text>
                <Button label="Повторить" size="sm" variant="ghost" onClick={() => setRetry((r) => r + 1)} />
              </HStack>
            )}
            {search.kind === 'ready' && search.list.length === 0 && (
              <Text size="sm" color="secondary">Ничего не нашлось. Попробуйте ближайший крупный город.</Text>
            )}
            {(search.kind === 'ready' || search.kind === 'error') && search.list.length > 0 && !place && (
              <ul className="suggest" role="listbox" aria-label="Подсказки городов">
                {search.list.map((s) => (
                  <li key={`${s.name}${s.lat}`}>
                    <button type="button" role="option" aria-selected={false} onClick={() => { setPlace(s); setPlaceQ(s.name); setSearch({kind: 'idle'}); }}>
                      <MapPinIcon aria-hidden width={18} height={18} />
                      <span>{s.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </VStack>
          <VStack gap={3}>
            <VStack gap={0.5}>
              <Text weight="semibold">Запрос клиента</Text>
              <Text size="sm" color="secondary" textWrap="pretty">Необязательно. Попадёт в краткий разбор как точка А и точка Б.</Text>
            </VStack>
            <TextArea htmlName="from" label="Где сейчас" isOptional value={from} onChange={setFrom} rows={2} placeholder="Например: выгорела в найме, доход упёрся в потолок" />
            <TextArea htmlName="to" label="Куда хочет" isOptional value={to} onChange={setTo} rows={2} placeholder="Например: своё дело и спокойный рост дохода" />
          </VStack>
          <Button label={person ? 'Пересчитать разбор' : 'Собрать разбор'} variant="primary" size="lg" type="submit" width="100%" />
        </VStack>
      </form>
    </BottomSheet>
  );
}
