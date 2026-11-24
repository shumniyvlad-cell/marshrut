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
export function shareUrl(p: Person) {
  const {createdAt: _skip, ...rest} = p;
  void _skip;
  const u = new URL(location.href);
  u.searchParams.set('p', b64(JSON.stringify(rest)));
  return u.href;
}
function importFromUrl() {
  try {
    const u = new URL(location.href);
    const raw = u.searchParams.get('p');
    if (!raw) return;
    const p = JSON.parse(unb64(raw)) as Person;
    if (p && typeof p.id === 'string' && typeof p.name === 'string' && p.y && p.m && p.d && !state.people.some((x) => x.id === p.id)) {
      state = {...state, people: [{...p, createdAt: Date.now()}, ...state.people]};
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* приватный режим */ }
    }
    u.searchParams.delete('p');
    history.replaceState(null, '', u.href);
  } catch { /* битая ссылка: просто открываем как есть */ }
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
