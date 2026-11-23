import type {Person} from './engine';

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export const pad = (n: number) => String(n).padStart(2, '0');
export const dateRu = (p: Pick<Person, 'y' | 'm' | 'd'>) => `${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
export const timeRu = (p: Person) => (p.h === null || p.min === null ? 'время неизвестно' : `${pad(p.h)}:${pad(p.min)}`);
export const birthLine = (p: Person) =>
  [dateRu(p), timeRu(p), p.place?.name.split(',')[0]].filter(Boolean).join(', ');

/** Неразрывные пробелы после коротких слов: без висячих предлогов. */
export function typo(s: string): string {
  return s
    .replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2})\s/g, '$1$2 ')
    .replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2})\s/g, '$1$2 ')
    .replace(/\s—/g, ' —')
    .replace(/(\d)\s(\d{3})/g, '$1 $2');
}
export const paras = (s: string) => s.split(/\n\n+/).map((x) => typo(x.trim())).filter(Boolean);
