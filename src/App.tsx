import {lazy, Suspense, useEffect, useState} from 'react';
import {HStack} from '@astryxdesign/core/HStack';
import {Button} from '@astryxdesign/core/Button';
import {Skeleton} from '@astryxdesign/core/Skeleton';
import {VStack} from '@astryxdesign/core/VStack';
import {Cog6ToothIcon, PlusIcon} from '@heroicons/react/24/outline';
import {Home} from './Home';
import {NewPerson} from './NewPerson';
import {Settings} from './Settings';
import type {Person} from './engine';

// Разбор и обои тянут расчёты и библиотеку трактовок — грузим их отдельно.
const Report = lazy(() => import('./Report').then((m) => ({default: m.Report})));
const Wallpaper = lazy(() => import('./Wallpaper').then((m) => ({default: m.Wallpaper})));

export type Route =
  | {name: 'home'}
  | {name: 'report'; id: string; tab: string}
  | {name: 'wall'; id: string};

export function parseHash(): Route {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'r' && parts[1]) {
    if (parts[2] === 'wall') return {name: 'wall', id: parts[1]};
    return {name: 'report', id: parts[1], tab: parts[2] ?? 'route'};
  }
  return {name: 'home'};
}
export const go = (path: string) => { location.hash = path; };

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [editing, setEditing] = useState<Person | 'new' | null>(null);
  const [isSettings, setIsSettings] = useState(false);

  useEffect(() => {
    const on = () => {
      const next = parseHash();
      setRoute((prev) => {
        // смена вкладки разбора не прокручивает страницу наверх
        if (!(prev.name === 'report' && next.name === 'report' && prev.id === next.id)) scrollTo({top: 0});
        return next;
      });
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);

  return (
    <div className={`app is-${route.name}`} style={{['--sky-url' as string]: `url(${new URL(`${import.meta.env.BASE_URL}img/sky.webp`, location.href).href})`}}>
      <div className="sky no-print" aria-hidden>
        <img src={`${import.meta.env.BASE_URL}img/sky.webp`} alt="" width={1920} height={1111} />
        <i className="blob blob--a" />
        <i className="blob blob--b" />
      </div>
      <header className="bar glass no-print">
        <HStack className="bar__in" justify="between" vAlign="center" gap={2}>
          <a href="#/" className="brand" aria-label="Маршрут, на главную">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={28} height={28} />
            <span>Маршрут</span>
          </a>
          <HStack gap={2} vAlign="center">
            <Button label="Настройки" variant="ghost" isIconOnly icon={<Cog6ToothIcon />} onClick={() => setIsSettings(true)} />
            <Button label="Новый разбор" variant="primary" icon={<PlusIcon />} onClick={() => setEditing('new')} />
          </HStack>
        </HStack>
      </header>

      <main className="main">
        {route.name === 'home' && <Home onNew={() => setEditing('new')} />}
        <Suspense fallback={<Loading />}>
          {route.name === 'report' && <Report id={route.id} tab={route.tab} onEdit={(p) => setEditing(p)} />}
          {route.name === 'wall' && <Wallpaper id={route.id} />}
        </Suspense>
      </main>

      <NewPerson
        isOpen={editing !== null}
        person={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={(p) => { setEditing(null); go(`/r/${p.id}`); }}
      />
      <Settings isOpen={isSettings} onClose={() => setIsSettings(false)} />
    </div>
  );
}

export function Loading() {
  return (
    <VStack className="col" gap={4} paddingBlock={8}>
      <Skeleton width="40%" height={44} />
      <Skeleton width="70%" height={20} index={1} />
      <Skeleton width="100%" height={320} index={2} />
    </VStack>
  );
}
