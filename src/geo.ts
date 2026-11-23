// Поиск места рождения: координаты и часовой пояс. Open-Meteo без ключа, плюс свой список на случай, если сеть не ответит.
import type {Place} from './engine';

const OFFLINE: Place[] = [
  ['Москва', 55.7558, 37.6173, 'Europe/Moscow'], ['Санкт-Петербург', 59.9343, 30.3351, 'Europe/Moscow'],
  ['Вологда', 59.2239, 39.884, 'Europe/Moscow'], ['Ярославль', 57.6261, 39.8845, 'Europe/Moscow'],
  ['Новосибирск', 55.0084, 82.9357, 'Asia/Novosibirsk'], ['Екатеринбург', 56.8389, 60.6057, 'Asia/Yekaterinburg'],
  ['Казань', 55.7887, 49.1221, 'Europe/Moscow'], ['Нижний Новгород', 56.2965, 43.9361, 'Europe/Moscow'],
  ['Челябинск', 55.1644, 61.4368, 'Asia/Yekaterinburg'], ['Самара', 53.1959, 50.1002, 'Europe/Samara'],
  ['Омск', 54.9885, 73.3242, 'Asia/Omsk'], ['Ростов-на-Дону', 47.2357, 39.7015, 'Europe/Moscow'],
  ['Уфа', 54.7388, 55.9721, 'Asia/Yekaterinburg'], ['Красноярск', 56.0153, 92.8932, 'Asia/Krasnoyarsk'],
  ['Пермь', 58.0105, 56.2502, 'Asia/Yekaterinburg'], ['Воронеж', 51.672, 39.1843, 'Europe/Moscow'],
  ['Волгоград', 48.708, 44.5133, 'Europe/Volgograd'], ['Краснодар', 45.0355, 38.9753, 'Europe/Moscow'],
  ['Сочи', 43.6028, 39.7342, 'Europe/Moscow'], ['Саратов', 51.5336, 46.0343, 'Europe/Saratov'],
  ['Тюмень', 57.1522, 65.5272, 'Asia/Yekaterinburg'], ['Иркутск', 52.2869, 104.305, 'Asia/Irkutsk'],
  ['Хабаровск', 48.4827, 135.0838, 'Asia/Vladivostok'], ['Владивосток', 43.1155, 131.8855, 'Asia/Vladivostok'],
  ['Калининград', 54.7104, 20.4522, 'Europe/Kaliningrad'], ['Севастополь', 44.6167, 33.5254, 'Europe/Simferopol'],
  ['Симферополь', 44.9521, 34.1024, 'Europe/Simferopol'], ['Мурманск', 68.9585, 33.0827, 'Europe/Moscow'],
  ['Архангельск', 64.5401, 40.5433, 'Europe/Moscow'], ['Череповец', 59.1269, 37.9093, 'Europe/Moscow'],
  ['Алматы', 43.222, 76.8512, 'Asia/Almaty'], ['Астана', 51.1694, 71.4491, 'Asia/Almaty'],
  ['Шымкент', 42.3417, 69.5901, 'Asia/Almaty'], ['Караганда', 49.8047, 73.1094, 'Asia/Almaty'],
  ['Минск', 53.9006, 27.559, 'Europe/Minsk'], ['Киев', 50.4501, 30.5234, 'Europe/Kyiv'],
  ['Ташкент', 41.2995, 69.2401, 'Asia/Tashkent'], ['Бишкек', 42.8746, 74.5698, 'Asia/Bishkek'],
  ['Ереван', 40.1792, 44.4991, 'Asia/Yerevan'], ['Тбилиси', 41.7151, 44.8271, 'Asia/Tbilisi'],
  ['Баку', 40.4093, 49.8671, 'Asia/Baku'], ['Дубай', 25.2048, 55.2708, 'Asia/Dubai'],
].map(([name, lat, lon, tz]) => ({name: name as string, lat: lat as number, lon: lon as number, tz: tz as string}));

export function offlineSearch(q: string): Place[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return OFFLINE.filter((p) => p.name.toLowerCase().startsWith(s)).slice(0, 6);
}

interface OmResult { name: string; latitude: number; longitude: number; timezone?: string; country?: string; admin1?: string }

export async function searchPlace(q: string, signal?: AbortSignal): Promise<Place[]> {
  if (new URLSearchParams(location.search).get('fail') === 'geo') throw new Error('fail');
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=7&language=ru&format=json&name=${encodeURIComponent(q.trim())}`;
  const r = await fetch(url, {signal});
  if (!r.ok) throw new Error(String(r.status));
  const j = (await r.json()) as {results?: OmResult[]};
  return (j.results ?? []).filter((x) => x.timezone).map((x) => ({
    name: [x.name, x.admin1 && x.admin1 !== x.name ? x.admin1 : '', x.country].filter(Boolean).join(', '),
    lat: x.latitude, lon: x.longitude, tz: x.timezone!,
  }));
}
