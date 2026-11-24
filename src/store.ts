// Клиенты эксперта и настройки — в браузере. В бою переедет в базу, интерфейс не меняется.

import {useSyncExternalStore} from 'react';
import type {Person} from './engine';

export type Mode = 'system' | 'light' | 'dark';
export interface Expert { name: string; contact: string }
type State = {people: Person[]; mode: Mode; expert: Expert};

const KEY = 'marshrut.state';
const fresh: State = {people: [], mode: 'dark', expert: {name: '', contact: ''}};

function load(): State {
  try {
    return {...fresh, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<State>)};
  } catch {
    return fresh;
  }
}
let state = load();

/* Ссылка с данными человека: разборы живут в браузере, и без неё ссылка из Telegram в Safari открыла бы пустоту. */
const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));
// данные человека — во фрагменте (#…): он не уходит на сервер. Заметку эксперта в ссылку не кладём.
export function shareUrl(p: Person) {
  const {createdAt: _c, note: _n, id: _i, ...rest} = p;
  void _c; void _n; void _i;
  const tab = location.hash.split('/')[3] ?? 'route';
  return `${location.origin}${location.pathname}#/p/${b64(JSON.stringify(rest))}/${tab}`;
}

const int = (v: unknown, lo: number, hi: number) => (Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi ? (v as number) : null);
const txt = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);
function validTz(tz: unknown) {
  if (typeof tz !== 'string' || tz.length > 64) return null;
  try {
    new Intl.DateTimeFormat('en', {timeZone: tz});
    return tz;
  } catch {
    return null;
  }
}
// строгая проверка всего, что пришло из ссылки: лишние поля отбрасываем, id выдаём свой
function personFrom(raw: unknown): Omit<Person, 'id' | 'createdAt'> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const name = txt(o.name, 60)?.trim();
  const y = int(o.y, 1900, 2100), m = int(o.m, 1, 12), d = int(o.d, 1, 31);
  if (!name || y === null || m === null || d === null) return null;
  const h = o.h === null ? null : int(o.h, 0, 23);
  const min = o.min === null ? null : int(o.min, 0, 59);
  let place: Person['place'] = null;
  if (o.place && typeof o.place === 'object') {
    const pl = o.place as Record<string, unknown>;
    const lat = Number(pl.lat), lon = Number(pl.lon), tz = validTz(pl.tz), pn = txt(pl.name, 120);
    if (pn && tz && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) place = {name: pn, lat, lon, tz};
  }
  return {name, y, m, d, h: h ?? null, min: min ?? null, place, from: txt(o.from, 500), to: txt(o.to, 500)};
}

function importFromUrl() {
  const m = location.hash.match(/^#\/p\/([A-Za-z0-9_-]{8,6000})(?:\/(\w+))?/);
  if (!m) return;
  let target = '#/';
  try {
    const p = personFrom(JSON.parse(unb64(m[1])));
    if (p) {
      // тот же человек уже есть — открываем его, не плодим копии
      const same = state.people.find((x) => x.name === p.name && x.y === p.y && x.m === p.m && x.d === p.d && x.h === p.h && x.min === p.min);
      const id = same?.id ?? Math.random().toString(36).slice(2, 10);
      if (!same) {
        state = {...state, people: [{...p, id, createdAt: Date.now()}, ...state.people]};
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* приватный режим */ }
      }
      target = `#/r/${id}/${m[2] ?? 'route'}`;
    }
  } catch { /* битая ссылка: открываем главную */ }
  history.replaceState(null, '', location.pathname + target);
}
if (typeof location !== 'undefined') importFromUrl();
const subs = new Set<() => void>();

function set(next: Partial<State>) {
  state = {...state, ...next};
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* приватный режим */
  }
  subs.forEach((f) => f());
}

export function useStore() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
  );
}

export const store = {
  get: () => state,
  save(p: Person) {
    const rest = state.people.filter((x) => x.id !== p.id);
    set({people: [p, ...rest]});
  },
  remove(id: string) {
    const p = state.people.find((x) => x.id === id) ?? null;
    set({people: state.people.filter((x) => x.id !== id)});
    return p;
  },
  restore(p: Person) {
    set({people: [p, ...state.people.filter((x) => x.id !== p.id)].sort((a, b) => b.createdAt - a.createdAt)});
  },
  setMode: (mode: Mode) => set({mode}),
  setExpert: (expert: Expert) => set({expert}),
};

export const newId = () => Math.random().toString(36).slice(2, 10);

/** Пример для первого входа: эксперт сразу видит, как выглядит разбор. */
export const SAMPLE: Person = {
  id: 'sample',
  name: 'Анна Соколова',
  y: 1990, m: 5, d: 12, h: 8, min: 40,
  place: {name: 'Вологда, Россия', lat: 59.2239, lon: 39.884, tz: 'Europe/Moscow'},
  createdAt: 0,
};
