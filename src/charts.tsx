// Схемы разбора: натальное колесо, бодиграф, Матрица судьбы, квадрат Пифагора. Цвета — из CSS-классов, чтобы работали обе темы.
import {type ReactElement} from 'react';
import type {NatalChart, Placement} from './engine/astro';
import {POINT_GLYPH, POINT_RU, SIGNS, SIGN_GLYPH, SIGN_RU, norm} from './engine/astro';
import {CENTERS, CENTER_RU, CHANNELS, centerOfGate, type CenterId, type HdChart} from './engine/hd';
import type {DestinyMatrix} from './engine/numbers';

const P = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
};

/* ───────── Натальная карта ───────── */
export function NatalWheel({chart, size = 420}: {chart: NatalChart; size?: number}) {
  const c = 200;
  const asc = chart.placements.find((p) => p.id === 'asc')?.lon ?? 0;
  const ang = (lon: number) => 180 + (lon - asc);
  const planets = chart.placements.filter((p) => p.id !== 'asc' && p.id !== 'mc');
  // разводим близкие планеты по кругу
  const sorted = [...planets].sort((a, b) => a.lon - b.lon);
  const shown = new Map<string, number>();
  let prev = -999;
  for (const p of sorted) {
    let a = p.lon;
    if (a - prev < 8) a = prev + 8;
    shown.set(p.id, a);
    prev = a;
  }
  const byId = new Map<string, Placement>(planets.map((p) => [p.id, p]));
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} className="wheel" role="img" aria-label="Натальная карта">
      <circle cx={c} cy={c} r={192} className="wheel__ring" />
      <circle cx={c} cy={c} r={162} className="wheel__line" />
      <circle cx={c} cy={c} r={96} className="wheel__line" />
      {SIGNS.map((s, i) => {
        const [x1, y1] = P(c, c, 192, ang(i * 30));
        const [x2, y2] = P(c, c, 162, ang(i * 30));
        const [tx, ty] = P(c, c, 177, ang(i * 30 + 15));
        return (
          <g key={s}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="wheel__line" />
            <text x={tx} y={ty} className={`wheel__sign el-${['fire', 'earth', 'air', 'water'][i % 4]}`} textAnchor="middle" dominantBaseline="central">
              <title>{SIGN_RU[s]}</title>{SIGN_GLYPH[s]}
            </text>
          </g>
        );
      })}
      {Array.from({length: 72}, (_, i) => {
        const [x1, y1] = P(c, c, 162, ang(i * 5));
        const [x2, y2] = P(c, c, i % 2 ? 158 : 155, ang(i * 5));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="wheel__tick" />;
      })}
      {chart.cusps?.map((cu, i) => {
        const [x1, y1] = P(c, c, 162, ang(cu));
        const [x2, y2] = P(c, c, 96, ang(cu));
        const next = chart.cusps![(i + 1) % 12];
        const mid = cu + norm(next - cu) / 2;
        const [tx, ty] = P(c, c, 104, ang(mid));
        const axis = i === 0 || i === 3 || i === 6 || i === 9;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className={axis ? 'wheel__axis' : 'wheel__cusp'} />
            <text x={tx} y={ty} className="wheel__house" textAnchor="middle" dominantBaseline="central">{i + 1}</text>
          </g>
        );
      })}
      {chart.aspects.map((a, i) => {
        const pa = byId.get(a.a), pb = byId.get(a.b);
        if (!pa || !pb || a.type === 'conjunction') return null;
        const [x1, y1] = P(c, c, 94, ang(pa.lon));
        const [x2, y2] = P(c, c, 94, ang(pb.lon));
        const tense = a.type === 'square' || a.type === 'opposition';
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={tense ? 'wheel__asp-tense' : 'wheel__asp-soft'} />;
      })}
      {planets.map((p) => {
        const a = shown.get(p.id)!;
        const [x, y] = P(c, c, 138, ang(a));
        const [mx1, my1] = P(c, c, 162, ang(p.lon));
        const [mx2, my2] = P(c, c, 152, ang(p.lon));
        const [dx, dy] = P(c, c, 96, ang(p.lon));
        return (
          <g key={p.id}>
            <line x1={mx1} y1={my1} x2={mx2} y2={my2} className="wheel__mark" />
            <circle cx={dx} cy={dy} r={2} className="wheel__dot" />
            <text x={x} y={y} className="wheel__planet" textAnchor="middle" dominantBaseline="central">
              <title>{POINT_RU[p.id]}{p.retro ? ' (ретроградный)' : ''}</title>{POINT_GLYPH[p.id]}
            </text>
            {p.retro && <text x={x + 9} y={y + 8} className="wheel__retro">R</text>}
          </g>
        );
      })}
      {chart.cusps && (
        <>
          <text {...xy(P(c, c, 199, 180))} className="wheel__axis-label" textAnchor="end" dominantBaseline="central" dx={-2}>Asc</text>
        </>
      )}
    </svg>
  );
}
const xy = ([x, y]: readonly [number, number]) => ({x, y});

/* ───────── Бодиграф ───────── */
// Классическая раскладка: у каждых ворот своё место на краю центра.
const SHAPES: Record<CenterId, string> = {
  head: 'M150,12 L180,64 L120,64 Z',
  ajna: 'M120,86 L180,86 L150,138 Z',
  throat: 'M124,164 h52 v52 h-52 Z',
  g: 'M150,240 L180,270 L150,300 L120,270 Z',
  heart: 'M212,282 L234,318 L190,318 Z',
  spleen: 'M28,322 L84,360 L28,398 Z',
  solar: 'M272,322 L216,360 L272,398 Z',
  sacral: 'M124,339 h52 v52 h-52 Z',
  root: 'M124,414 h52 v52 h-52 Z',
};
const GPOS: Record<number, [number, number]> = {
  64: [137, 57], 61: [150, 57], 63: [163, 57],
  47: [137, 93], 24: [150, 93], 4: [163, 93], 17: [139, 107], 43: [150, 124], 11: [161, 107],
  62: [136, 171], 23: [150, 171], 56: [164, 171], 16: [130, 184], 20: [130, 198], 35: [170, 178], 12: [170, 191], 45: [170, 204], 31: [137, 211], 8: [150, 211], 33: [163, 211],
  7: [141, 258], 1: [150, 250], 13: [159, 258], 10: [129, 270], 25: [171, 270], 15: [141, 282], 2: [150, 290], 46: [159, 282],
  21: [215, 296], 51: [203, 303], 26: [198, 313], 40: [224, 313],
  48: [36, 334], 57: [48, 342], 44: [60, 350], 50: [74, 360], 32: [60, 370], 28: [48, 378], 18: [36, 386],
  36: [264, 334], 22: [252, 342], 37: [240, 350], 6: [226, 360], 49: [240, 370], 55: [252, 378], 30: [264, 386],
  5: [137, 345], 14: [150, 345], 29: [163, 345], 34: [130, 356], 27: [130, 374], 59: [170, 366], 42: [137, 385], 3: [150, 385], 9: [163, 385],
  53: [137, 420], 60: [150, 420], 52: [163, 420], 54: [130, 430], 38: [130, 443], 58: [130, 456], 19: [170, 430], 39: [170, 443], 41: [170, 456],
};

export function Bodygraph({hd, size = 300}: {hd: HdChart; size?: number}) {
  const halves: ReactElement[] = [];
  for (const [ga, gb] of CHANNELS) {
    const a = GPOS[ga], b = GPOS[gb];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    for (const [g, from] of [[ga, a], [gb, b]] as const) {
      const st = hd.gates.get(g);
      const d = `M${from[0]},${from[1]} L${mid[0]},${mid[1]}`;
      const cls = !st ? 'bg__ch' : st.p ? 'bg__ch is-p' : 'bg__ch is-d';
      halves.push(<path key={`${ga}-${gb}-${g}`} d={d} className={cls} />);
      if (st?.p && st.d) halves.push(<path key={`${ga}-${gb}-${g}d`} d={d} className="bg__ch is-both-d" />);
    }
  }
  return (
    <svg viewBox="0 0 300 480" width={size} height={(size * 480) / 300} className="bg" role="img" aria-label="Бодиграф">
      <g>{halves}</g>
      {CENTERS.map((id) => (
        <path key={id} d={SHAPES[id]} className={`bg__center${hd.defined.has(id) ? ' is-def' : ''}`}>
          <title>{CENTER_RU[id]}: {hd.defined.has(id) ? 'определён' : 'открыт'}</title>
        </path>
      ))}
      {Object.entries(GPOS).map(([g, [x, y]]) => {
        const on = hd.gates.has(Number(g));
        const def = hd.defined.has(centerOfGate[Number(g)]);
        return (
          <text key={g} x={x} y={y} className={`bg__gate${on ? ' is-on' : ''}${def ? ' on-def' : ''}`} textAnchor="middle" dominantBaseline="central">{g}</text>
        );
      })}
    </svg>
  );
}

/* ───────── Матрица судьбы ───────── */
export function MatrixChart({m, size = 360}: {m: DestinyMatrix; size?: number}) {
  const c = 180, R = 150, r2 = R * 0.72;
  const pts: {k: string; v: number; x: number; y: number; big?: boolean; label?: string}[] = [
    {k: 'A', v: m.A, x: c - R, y: c, big: true, label: 'Личность'},
    {k: 'B', v: m.B, x: c, y: c - R, big: true, label: 'Таланты'},
    {k: 'C', v: m.C, x: c + R, y: c, big: true, label: 'Материальное'},
    {k: 'D', v: m.D, x: c, y: c + R, big: true, label: 'Хвост'},
    {k: 'F', v: m.F, x: c - r2 * 1.06, y: c - r2 * 1.06},
    {k: 'G', v: m.G, x: c + r2 * 1.06, y: c - r2 * 1.06},
    {k: 'H', v: m.H, x: c + r2 * 1.06, y: c + r2 * 1.06},
    {k: 'I', v: m.I, x: c - r2 * 1.06, y: c + r2 * 1.06},
    {k: 'E', v: m.E, x: c, y: c, big: true, label: 'Центр'},
    {k: 'B1', v: m.talent[1], x: c, y: c - R * 0.68},
    {k: 'B2', v: m.talent[2], x: c, y: c - R * 0.38},
    {k: 'D1', v: m.tail[1], x: c, y: c + R * 0.68},
    {k: 'D2', v: m.tail[2], x: c, y: c + R * 0.38},
    {k: '$', v: m.money, x: c + R * 0.62, y: c + R * 0.3, label: 'Деньги'},
    {k: '♡', v: m.love, x: c + R * 0.3, y: c + R * 0.62, label: 'Любовь'},
  ];
  return (
    <svg viewBox="-20 -10 400 380" width={size} height={(size * 380) / 400} className="mx" role="img" aria-label="Матрица судьбы">
      <path d={`M${c - R},${c} L${c},${c - R} L${c + R},${c} L${c},${c + R} Z`} className="mx__line" />
      <rect x={c - r2 * 1.06} y={c - r2 * 1.06} width={r2 * 2.12} height={r2 * 2.12} className="mx__line" />
      <line x1={c - R} y1={c} x2={c + R} y2={c} className="mx__line mx__line--soft" />
      <line x1={c} y1={c - R} x2={c} y2={c + R} className="mx__line mx__line--soft" />
      <line x1={c + R * 0.62} y1={c + R * 0.3} x2={c + R * 0.3} y2={c + R * 0.62} className="mx__line mx__line--soft" />
      {pts.map((p) => (
        <g key={p.k}>
          <circle cx={p.x} cy={p.y} r={p.big ? 21 : 15} className={`mx__dot${p.k === 'E' ? ' is-center' : p.k === 'D' ? ' is-tail' : ''}`} />
          <text x={p.x} y={p.y} className={`mx__num${p.big ? ' is-big' : ''}${p.k === 'E' ? ' is-center' : ''}`} textAnchor="middle" dominantBaseline="central">{p.v}</text>
          {p.label && (() => {
            const pos: Record<string, [number, number, 'start' | 'middle' | 'end']> = {
              A: [p.x, p.y + 34, 'middle'], B: [p.x, p.y - 30, 'middle'], C: [p.x, p.y + 34, 'middle'], D: [p.x, p.y + 34, 'middle'],
              E: [p.x, p.y + 34, 'middle'], $: [p.x - 20, p.y + 4, 'end'], '♡': [p.x + 4, p.y + 26, 'middle'],
            };
            const [lx, ly, an] = pos[p.k];
            return <text x={lx} y={ly} className="mx__label" textAnchor={an} dominantBaseline="central">{p.label}</text>;
          })()}
        </g>
      ))}
    </svg>
  );
}

/* ───────── Квадрат Пифагора ───────── */
export function PythagorasGrid({cells}: {cells: Record<number, number>}) {
  const order = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
  return (
    <table className="py" aria-label="Квадрат Пифагора">
      <tbody>
        {order.map((row, i) => (
          <tr key={i}>
            {row.map((d) => (
              <td key={d} className={cells[d] === 0 ? 'is-empty' : undefined}>
                <span className="py__digits">{cells[d] ? String(d).repeat(cells[d]) : 'нет'}</span>
                <span className="py__count">{d}</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
