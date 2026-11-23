// Человек → расчёты + библиотека трактовок + маршрут. Общий хук для разбора и обоев.
import {useEffect, useMemo, useState} from 'react';
import {compute, type Calc, type Person} from './engine';
import {buildRoute, type Route} from './engine/route';
import {loadLibrary, type Library} from './content';
import {SAMPLE, store, useStore} from './store';

export type ReportState =
  | {kind: 'missing'}
  | {kind: 'loading'; person: Person}
  | {kind: 'error'; person: Person; retry: () => void}
  | {kind: 'ready'; person: Person; calc: Calc; lib: Library; route: Route};

export function useReport(id: string): ReportState {
  const {people} = useStore();
  // пример открывается по ссылке даже в чистом браузере
  const person = people.find((p) => p.id === id) ?? (id === SAMPLE.id ? SAMPLE : null);
  useEffect(() => {
    if (id === SAMPLE.id && !store.get().people.some((p) => p.id === id)) store.save({...SAMPLE, createdAt: Date.now()});
  }, [id]);
  const [lib, setLib] = useState<Library | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setFailed(false);
    const fail = new URLSearchParams(location.search).get('fail') === 'lib' && attempt === 0;
    (fail ? Promise.reject(new Error('fail')) : loadLibrary())
      .then((l) => live && setLib(l))
      .catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [attempt]);

  const calc = useMemo(() => (person ? compute(person) : null), [person]);
  const route = useMemo(() => (calc && lib ? buildRoute(calc, lib) : null), [calc, lib]);

  if (!person) return {kind: 'missing'};
  if (failed) return {kind: 'error', person, retry: () => setAttempt((a) => a + 1)};
  if (!lib || !calc || !route) return {kind: 'loading', person};
  return {kind: 'ready', person, calc, lib, route};
}
