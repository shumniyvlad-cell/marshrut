// Обои с маршрутом: рисуем на canvas в полном разрешении экрана.
import type {Route} from './engine/route';
import type {NatalChart} from './engine/astro';
import {typo} from './format';

export type WallFormat = 'desktop' | 'laptop' | 'phone';
export type WallTheme = 'night' | 'pearl' | 'bamboo';
export const FORMATS: Record<WallFormat, {w: number; h: number; label: string}> = {
  desktop: {w: 2560, h: 1440, label: 'Монитор'},
  laptop: {w: 2880, h: 1800, label: 'Ноутбук'},
  phone: {w: 1179, h: 2556, label: 'Телефон'},
};
// палитра «Перепрошивки»: чёрный, белый, бамбуковый зелёный; «не делать» — приглушённая терракота
const THEMES: Record<WallTheme, {bg: string; ink: string; dim: string; acc: string; neg: string; line: string; star: string}> = {
  night: {bg: '#0B0D0B', ink: '#F2F5EF', dim: 'rgba(242,245,239,.64)', acc: '#7DBE57', neg: '#E39A84', line: 'rgba(205,235,180,.12)', star: 'rgba(205,235,180,.55)'},
  pearl: {bg: '#F4F6F2', ink: '#0B0D0B', dim: 'rgba(11,13,11,.64)', acc: '#3D7B33', neg: '#A9472F', line: 'rgba(11,13,11,.10)', star: 'rgba(61,123,51,.35)'},
  bamboo: {bg: '#2F6A2A', ink: '#FFFFFF', dim: 'rgba(255,255,255,.76)', acc: '#CDEBB4', neg: '#F6C9BC', line: 'rgba(255,255,255,.16)', star: 'rgba(205,235,180,.6)'},
};

export interface WallOptions {
  format: WallFormat;
  theme: WallTheme;
  count: number;
  scenario: boolean;
  signature: string;
}

const HEAD = '"Ysabeau Variable", "Ysabeau Office Variable", Georgia, serif';
const BODY = '"Ysabeau Office Variable", system-ui, sans-serif';

export async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load(`600 40px "Ysabeau Variable"`),
      document.fonts.load(`italic 400 40px "Ysabeau Variable"`),
      document.fonts.load(`500 40px "Ysabeau Office Variable"`),
      document.fonts.load(`700 40px "Ysabeau Office Variable"`),
    ]);
  } catch { /* рисуем запасным шрифтом */ }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > maxW && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}
function para(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const lines = wrap(ctx, text, maxW);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
  return y + lines.length * lh;
}

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Личное небо фоном: кольцо зодиака и планеты на своих местах. */
function sky(ctx: CanvasRenderingContext2D, chart: NatalChart, cx: number, cy: number, r: number, t: typeof THEMES.night, seed: number) {
  ctx.save();
  ctx.strokeStyle = t.line;
  ctx.lineWidth = Math.max(1.5, r * 0.003);
  for (const k of [1, 0.86, 0.5]) { ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, Math.PI * 2); ctx.stroke(); }
  const asc = chart.placements.find((p) => p.id === 'asc')?.lon ?? 0;
  const ang = (lon: number) => ((180 + lon - asc) * Math.PI) / 180;
  for (let i = 0; i < 12; i++) {
    const a = ang(i * 30);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.86, cy - Math.sin(a) * r * 0.86);
    ctx.lineTo(cx + Math.cos(a) * r, cy - Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.fillStyle = t.star;
  ctx.globalAlpha = 0.55;
  for (const p of chart.placements) {
    if (p.id === 'asc' || p.id === 'mc') continue;
    const a = ang(p.lon);
    const big = p.id === 'sun' || p.id === 'moon';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.68, cy - Math.sin(a) * r * 0.68, r * (big ? 0.012 : 0.007), 0, Math.PI * 2);
    ctx.fill();
  }
  const rnd = seeded(seed);
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 90; i++) {
    const a = rnd() * Math.PI * 2, d = r * (0.08 + rnd() * 1.5);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.0015 + rnd() * 0.003), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function list(ctx: CanvasRenderingContext2D, title: string, items: string[], x: number, y: number, w: number, s: number, color: string, t: typeof THEMES.night) {
  ctx.fillStyle = color;
  ctx.font = `italic 400 ${s * 2.1}px ${HEAD}`;
  ctx.fillText(title, x, y);
  y += s * 2.4;
  items.forEach((it, i) => {
    ctx.fillStyle = color;
    ctx.font = `700 ${s * 0.8}px ${BODY}`;
    ctx.fillText(String(i + 1).padStart(2, '0'), x, y + s * 0.05);
    ctx.fillStyle = t.ink;
    ctx.font = `500 ${s}px ${BODY}`;
    y = para(ctx, typo(it), x + s * 1.9, y, w - s * 1.9, s * 1.28) + s * 0.6;
  });
  return y;
}

export function drawWall(canvas: HTMLCanvasElement, route: Route, chart: NatalChart, name: string, seed: number, o: WallOptions) {
  const {w: W, h: H} = FORMATS[o.format];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const t = THEMES[o.theme];
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'top';
  const first = name.split(' ')[0];
  const scen = route.scenarios[0];
  // выход из сценария стоит внизу отдельно, в списке его не повторяем
  const doIt = route.doTop.map((i) => i.text).filter((t) => !(o.scenario && scen && t === scen.exit)).slice(0, o.count);
  const dont = route.dontTop.slice(0, o.count).map((i) => i.text);
  const daily = route.daily.filter((d) => d !== route.rule);

  if (o.format === 'phone') {
    sky(ctx, chart, W * 0.82, H * 0.13, W * 0.62, t, seed);
    const pad = W * 0.08, s = W * 0.038;
    let y = H * 0.215;
    ctx.fillStyle = t.dim; ctx.font = `500 ${s * 0.9}px ${BODY}`;
    ctx.fillText(`Маршрут: ${first}`, pad, y); y += s * 1.6;
    ctx.fillStyle = t.ink; ctx.font = `600 ${s * 2.4}px ${HEAD}`;
    y = para(ctx, route.title, pad, y, W - pad * 2, s * 2.5) + s * 0.4;
    ctx.fillStyle = t.dim; ctx.font = `500 ${s}px ${BODY}`;
    y = para(ctx, typo(`${route.strategy}. ${route.rule}.`), pad, y, W - pad * 2, s * 1.3) + s * 1.4;
    y = list(ctx, 'Делать', doIt.slice(0, Math.min(o.count, 5)), pad, y, W - pad * 2, s, t.acc, t) + s * 0.8;
    y = list(ctx, 'Не делать', dont.slice(0, Math.min(o.count, 5)), pad, y, W - pad * 2, s, t.neg, t);
    if (o.scenario && scen && y < H * 0.82) {
      y += s;
      ctx.fillStyle = t.dim; ctx.font = `500 ${s * 0.85}px ${BODY}`;
      para(ctx, typo(`Выход из сценария: ${scen.exit}`), pad, y, W - pad * 2, s * 1.2);
    }
    if (o.signature) { ctx.fillStyle = t.dim; ctx.font = `500 ${s * 0.7}px ${BODY}`; ctx.fillText(o.signature, pad, H * 0.885); }
    return;
  }

  sky(ctx, chart, W * 0.9, H * 0.92, H * 0.62, t, seed);
  const pad = W * 0.055, s = H * 0.0262;
  // левая колонка: кто человек и как решать
  let y = H * 0.11;
  const lw = W * 0.3;
  ctx.fillStyle = t.dim; ctx.font = `500 ${s}px ${BODY}`;
  ctx.fillText(`Маршрут: ${first}`, pad, y); y += s * 2;
  // заголовок в одну строку: уменьшаем, пока не влезет
  let ts = s * 3.6;
  ctx.font = `600 ${ts}px ${HEAD}`;
  while (ctx.measureText(route.title).width > lw && ts > s * 2.4) { ts -= s * 0.1; ctx.font = `600 ${ts}px ${HEAD}`; }
  ctx.fillStyle = t.ink;
  y = para(ctx, route.title, pad, y, lw, ts * 1.03) + s * 0.8;
  ctx.fillStyle = t.acc; ctx.font = `700 ${s * 1.05}px ${BODY}`;
  y = para(ctx, typo(route.strategy), pad, y, lw, s * 1.4);
  ctx.fillStyle = t.ink; ctx.font = `500 ${s * 1.05}px ${BODY}`;
  y = para(ctx, typo(route.rule), pad, y + s * 0.2, lw, s * 1.4) + s * 1.6;
  ctx.fillStyle = t.dim; ctx.font = `italic 400 ${s * 1.5}px ${HEAD}`;
  ctx.fillText('Каждый день', pad, y); y += s * 2;
  ctx.font = `500 ${s}px ${BODY}`;
  for (const d of daily.slice(0, 3)) { ctx.fillStyle = t.ink; y = para(ctx, typo(d), pad, y, lw, s * 1.3) + s * 0.5; }

  const cw = W * 0.25;
  list(ctx, 'Делать', doIt, W * 0.39, H * 0.11, cw, s, t.acc, t);
  list(ctx, 'Не делать', dont, W * 0.67, H * 0.11, cw, s, t.neg, t);

  if (o.scenario && scen) {
    const by = H * 0.8;
    ctx.fillStyle = t.dim; ctx.font = `500 ${s * 0.9}px ${BODY}`;
    ctx.fillText('Повторяется', pad, by);
    ctx.fillText('Выход', W * 0.39, by);
    ctx.fillStyle = t.ink; ctx.font = `500 ${s}px ${BODY}`;
    para(ctx, typo(scen.repeat), pad, by + s * 1.5, W * 0.31, s * 1.3);
    ctx.font = `700 ${s}px ${BODY}`;
    para(ctx, typo(scen.exit), W * 0.39, by + s * 1.5, W * 0.4, s * 1.3);
  }
  if (o.signature) { ctx.fillStyle = t.dim; ctx.font = `500 ${s * 0.75}px ${BODY}`; ctx.fillText(o.signature, pad, H * 0.955); }
}
