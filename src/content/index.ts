// Библиотека трактовок. Грузится одним отдельным куском, когда открывают разбор.

export interface Entry { title: string; short: string; text: string; do: string[]; dont: string[] }
export interface Short { title?: string; short: string; text: string }
type SignMap<T> = Record<string, T>;

export interface Library {
  signs: Record<string, SignMap<Entry>>; // planet → sign → Entry
  houses: {
    houses: Record<string, Short & {title: string}>;
    planets: Record<string, Record<string, Entry>>;
    aspects: {
      types: Record<string, Short & {title: string}>;
      pairs: Record<string, {title: string; harmonious: string; tense: string; do: string[]; dont: string[]}>;
    };
  } | null;
  hd: {
    types: Record<string, Entry & {strategy: string; signature: string; notself: string}>;
    authorities: Record<string, Entry>;
    profiles: Record<string, Entry>;
    lines: Record<string, {title: string; short: string}>;
    centers: Record<string, {title: string; defined: Entry; open: Entry}>;
    definitions: Record<string, Short & {title: string}>;
    angles: Record<string, Short & {title: string}>;
    gates: Record<string, Entry & {keynote: string}>;
    channels: Record<string, Entry>;
  };
  matrix: Record<string, {
    name: string; plus: string; minus: string;
    personality: Entry;
    talent: {short: string; text: string};
    tail: {title: string; text: string; scenario: string; exit: string};
    money: {text: string; do: string[]; dont: string[]};
    love: {text: string; do: string[]; dont: string[]};
    purpose: {text: string};
    health: {text: string};
  }>;
  numbers: {
    lifepath: Record<string, Entry>;
    personalYear: Record<string, Entry>;
    expression: Record<string, {short: string; text: string}>;
    soul: Record<string, {short: string; text: string}>;
    personality: Record<string, {short: string; text: string}>;
    pythagoras: {
      cells: Record<string, {title: string; levels: Record<string, {short: string; text: string}>}>;
      lines: Record<string, {title: string; low: string; mid: string; high: string}>;
    };
  };
  east: {
    stems: Record<string, Entry & {element: string; yin: boolean; image: string}>;
    elements: Record<string, {title: string; excess: {text: string; do: string[]; dont: string[]}; lack: {text: string; do: string[]; dont: string[]}}>;
    animals: Record<string, {title: string; short: string; text: string}>;
    genekeys: Record<string, {shadow: string; gift: string; siddhi: string; short: string}>;
    spheres: Record<string, {title: string; short: string}>;
  };
}

let cache: Promise<Library> | null = null;

export function loadLibrary(): Promise<Library> {
  if (cache) return cache;
  const houses = import.meta.glob<{default: Library['houses']}>('./astro-houses.json');
  cache = Promise.all([
    import('./astro-signs-a.json'),
    import('./astro-signs-b.json'),
    import('./hd-core.json'),
    import('./hd-gates.json'),
    import('./matrix.json'),
    import('./numbers.json'),
    import('./east.json'),
    houses['./astro-houses.json'] ? houses['./astro-houses.json']() : Promise.resolve({default: null}),
  ]).then(([a, b, hc, hg, m, n, e, h]) => ({
    signs: {...(a.default as Library['signs']), ...(b.default as Library['signs'])},
    houses: (h.default ?? null) as Library['houses'],
    hd: {...(hc.default as object), ...(hg.default as object)} as Library['hd'],
    matrix: (m.default as {arcana: Library['matrix']}).arcana,
    numbers: n.default as unknown as Library['numbers'],
    east: e.default as unknown as Library['east'],
  }));
  cache.catch(() => { cache = null; });
  return cache;
}
