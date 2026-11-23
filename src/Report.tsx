// Разбор человека: шапка, вкладки по системам, печать в PDF.
import {useState} from 'react';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Banner} from '@astryxdesign/core/Banner';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {TabList, Tab} from '@astryxdesign/core/TabList';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {useToast} from '@astryxdesign/core/Toast';
import {ArrowDownTrayIcon, PencilSquareIcon, PhotoIcon, TrashIcon, MagnifyingGlassIcon} from '@heroicons/react/24/outline';
import type {Person} from './engine';
import {useReport} from './useReport';
import {DatesSection} from './dates';
import {NatalWheel} from './charts';
import {AstroSection, EastSection, HdSection, KeysSection, MatrixSection, NumbersSection, RouteSection} from './sections';
import {birthLine} from './format';
import {fmtOffset} from './engine/time';
import {store, useStore} from './store';
import {go, Loading} from './App';

const TABS = [
  ['route', 'Маршрут'],
  ['dates', 'Даты'],
  ['astro', 'Астрология'],
  ['hd', 'Дизайн человека'],
  ['matrix', 'Матрица судьбы'],
  ['numbers', 'Числа'],
  ['bazi', 'Ба Цзы'],
  ['keys', 'Генные ключи'],
] as const;

export function Report({id, tab, onEdit}: {id: string; tab: string; onEdit: (p: Person) => void}) {
  const st = useReport(id);
  const {expert} = useStore();
  const [asking, setAsking] = useState(false);
  const toast = useToast();
  const active = TABS.some(([k]) => k === tab) ? tab : 'route';

  if (st.kind === 'missing') {
    return (
      <VStack className="col" paddingBlock={10}>
        <EmptyState
          icon={<MagnifyingGlassIcon />}
          title="Такого разбора здесь нет"
          description="Разборы хранятся в браузере, где их создали. Возможно, его удалили или открыли ссылку на другом устройстве."
          actions={<Button label="К списку клиентов" variant="primary" onClick={() => go('/')} />}
        />
      </VStack>
    );
  }
  const p = st.person;

  // PDF всегда светлый: на время печати переключаем тему и возвращаем обратно
  const printLight = () => {
    const prev = store.get().mode;
    if (prev === 'light') return print();
    store.setMode('light');
    const back = () => { store.setMode(prev); removeEventListener('afterprint', back); };
    addEventListener('afterprint', back);
    requestAnimationFrame(() => requestAnimationFrame(() => print()));
  };

  const remove = () => {
    const removed = store.remove(p.id);
    setAsking(false);
    go('/');
    if (removed) toast({body: `Разбор «${removed.name}» удалён`, endContent: <Button label="Вернуть" variant="ghost" size="sm" onClick={() => store.restore(removed)} />});
  };

  return (
    <VStack className="col col--wide report" gap={6} paddingBlockEnd={10}>
      <header className="rep-head">
        {st.kind === 'ready' && <span className="rep-head__wheel" aria-hidden><NatalWheel chart={st.calc.natal} size={620} /></span>}
        <VStack gap={2}>
          <Text className="kicker">Разбор</Text>
          <h1 className="rep-head__name">{p.name}</h1>
          <Text color="secondary" hasTabularNumbers>
            {birthLine(p)}{st.kind === 'ready' && st.calc.timeKnown ? ` (${fmtOffset(st.calc.offset)})` : ''}
          </Text>
        </VStack>
        <HStack gap={2} wrap="wrap" className="no-print">
          <Button label="Обои" variant="primary" icon={<PhotoIcon />} onClick={() => go(`/r/${p.id}/wall`)} />
          <Button label="PDF" variant="secondary" icon={<ArrowDownTrayIcon />} isDisabled={st.kind !== 'ready'} onClick={printLight} tooltip="Откроется печать: выберите «Сохранить как PDF»" />
          <Button label="Изменить данные" variant="ghost" isIconOnly icon={<PencilSquareIcon />} onClick={() => onEdit(p)} />
          <Button label="Удалить разбор" variant="ghost" isIconOnly icon={<TrashIcon />} onClick={() => setAsking(true)} />
        </HStack>
      </header>

      <nav className="tabs no-print" aria-label="Разделы разбора">
        <TabList value={active} onChange={(v) => go(v === 'route' ? `/r/${p.id}` : `/r/${p.id}/${v}`)} hasDivider>
          {TABS.map(([k, l]) => <Tab key={k} value={k} label={l} />)}
        </TabList>
      </nav>

      {st.kind === 'loading' && <Loading />}
      {st.kind === 'error' && (
        <Banner
          status="error" title="Не загрузилась библиотека трактовок"
          description="Расчёты готовы, а тексты не подтянулись. Проверьте интернет и попробуйте ещё раз."
          endContent={<Button label="Повторить" variant="secondary" size="sm" onClick={st.retry} />}
        />
      )}
      {st.kind === 'ready' && (
        <>
          {TABS.map(([k, label]) => {
            const props = {calc: st.calc, lib: st.lib, route: st.route};
            return (
              <section key={k} className={`panel${k === active ? '' : ' is-off'}`} aria-label={label}>
                <Heading level={2} type="display-2" className="print-only panel__title">{label}</Heading>
                {k === 'route' && <RouteSection {...props} id={p.id} />}
                {k === 'dates' && <DatesSection calc={st.calc} lib={st.lib} />}
                {k === 'astro' && <AstroSection {...props} />}
                {k === 'hd' && <HdSection {...props} />}
                {k === 'matrix' && <MatrixSection {...props} />}
                {k === 'numbers' && <NumbersSection {...props} />}
                {k === 'bazi' && <EastSection {...props} />}
                {k === 'keys' && <KeysSection {...props} />}
              </section>
            );
          })}
          <footer className="rep-foot">
            <Text size="sm" color="secondary">
              {expert.name ? `Разбор: ${expert.name}${expert.contact ? `, ${expert.contact}` : ''}. ` : ''}
              Тропический зодиак, дома Плацидуса, истинный лунный узел. Разбор помогает понять себя и не заменяет врача или психотерапевта.
            </Text>
          </footer>
        </>
      )}

      <AlertDialog
        isOpen={asking}
        onOpenChange={(o) => !o && setAsking(false)}
        title="Удалить разбор?"
        description={`${p.name}: данные и расчёты пропадут из списка. Сразу после удаления можно вернуть.`}
        actionLabel="Удалить"
        cancelLabel="Оставить"
        onAction={remove}
      />
    </VStack>
  );
}
