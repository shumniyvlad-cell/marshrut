// Обои с маршрутом: формат экрана, оформление, скачать PNG.
import {useEffect, useRef, useState} from 'react';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Switch} from '@astryxdesign/core/Switch';
import {Banner} from '@astryxdesign/core/Banner';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {useToast} from '@astryxdesign/core/Toast';
import {ArrowDownTrayIcon, ArrowLeftIcon, MagnifyingGlassIcon} from '@heroicons/react/24/outline';
import {useReport} from './useReport';
import {useStore} from './store';
import {drawWall, ensureFonts, FORMATS, type WallFormat, type WallTheme} from './wall';
import {go, Loading} from './App';
import {TgHint} from './TgHint';

export function Wallpaper({id}: {id: string}) {
  const st = useReport(id);
  const {expert} = useStore();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<WallFormat>(() => (matchMedia('(max-width: 700px)').matches ? 'phone' : 'desktop'));
  const [theme, setTheme] = useState<WallTheme>('night');
  const [count, setCount] = useState(7);
  const [scenario, setScenario] = useState(true);
  const [sign, setSign] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const signature = sign && expert.name ? `Разбор: ${expert.name}${expert.contact ? `, ${expert.contact}` : ''}` : '';

  useEffect(() => {
    if (st.kind !== 'ready' || !canvas.current) return;
    let live = true;
    ensureFonts().then(() => {
      if (!live || !canvas.current) return;
      const p = st.person;
      drawWall(canvas.current, st.route, st.calc.natal, p.name, p.y * 10000 + p.m * 100 + p.d, {format, theme, count, scenario, signature});
    });
    return () => { live = false; };
  }, [st, format, theme, count, scenario, signature]);

  if (st.kind === 'missing') {
    return (
      <VStack className="col" paddingBlock={10}>
        <EmptyState icon={<MagnifyingGlassIcon />} title="Такого разбора здесь нет" description="Обои собираются из разбора, а он хранится в браузере, где его создали." actions={<Button label="К списку клиентов" variant="primary" onClick={() => go('/')} />} />
      </VStack>
    );
  }

  const download = () => {
    if (!canvas.current) return;
    setIsSaving(true);
    canvas.current.toBlob((blob) => {
      setIsSaving(false);
      if (!blob) return toast({body: 'Не получилось сохранить картинку, попробуйте ещё раз', type: 'error'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `marshrut-${st.person.name.split(' ')[0].toLowerCase()}-${format}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast({body: 'Обои сохранены в загрузки'});
    }, 'image/png');
  };

  const f = FORMATS[format];
  return (
    <VStack className="col col--wide" gap={6} paddingBlockEnd={10}>
      <HStack gap={3} vAlign="center" wrap="wrap" justify="between">
        <VStack gap={1} hAlign="start">
          <Button label="К разбору" variant="ghost" size="sm" icon={<ArrowLeftIcon />} onClick={() => go(`/r/${id}`)} />
          <Heading level={1} type="display-3">Обои: {st.person.name}</Heading>
          <Text color="secondary" textWrap="pretty">План на каждый день перед глазами: что делать, что не делать и как выйти из своего сценария.</Text>
        </VStack>
        <Button label="Скачать PNG" variant="primary" size="lg" icon={<ArrowDownTrayIcon />} onClick={download} isLoading={isSaving} isDisabled={st.kind !== 'ready'} />
      </HStack>
      <TgHint person={st.person} what="обои" />

      {st.kind === 'loading' && <Loading />}
      {st.kind === 'error' && (
        <Banner status="error" title="Не загрузилась библиотека трактовок" description="Без неё обоям не из чего собраться." endContent={<Button label="Повторить" variant="secondary" size="sm" onClick={st.retry} />} />
      )}
      {st.kind === 'ready' && (
        <section className="wall">
          <figure className={`wall__frame is-${format}`}>
            <canvas ref={canvas} className="wall__canvas" role="img" aria-label={`Обои ${f.w}×${f.h}`} />
            <figcaption><Text size="sm" color="secondary" hasTabularNumbers>{f.label}, {f.w}×{f.h}</Text></figcaption>
          </figure>
          <VStack gap={5} className="wall__opts">
            <SegmentedControl label="Экран" value={format} onChange={(v) => setFormat(v as WallFormat)} layout="fill">
              {(Object.keys(FORMATS) as WallFormat[]).map((k) => <SegmentedControlItem key={k} value={k} label={FORMATS[k].label} />)}
            </SegmentedControl>
            <SegmentedControl label="Оформление" value={theme} onChange={(v) => setTheme(v as WallTheme)} layout="fill">
              <SegmentedControlItem value="night" label="Ночь" />
              <SegmentedControlItem value="pearl" label="Светлые" />
              <SegmentedControlItem value="bamboo" label="Бамбук" />
            </SegmentedControl>
            <SegmentedControl label="Пунктов в каждом списке" value={String(count)} onChange={(v) => setCount(Number(v))} layout="fill">
              <SegmentedControlItem value="3" label="3" />
              <SegmentedControlItem value="5" label="5" />
              <SegmentedControlItem value="7" label="7" />
            </SegmentedControl>
            <Switch label="Сценарий и выход внизу" value={scenario} onChange={setScenario} />
            <Switch label="Ваша подпись" value={sign && !!expert.name} onChange={setSign} isDisabled={!expert.name} description={expert.name ? undefined : 'Добавьте имя в настройках (шестерёнка вверху)'} />
            <Text size="sm" color="secondary" textWrap="pretty">Фон — личное небо человека: кольцо зодиака и планеты на местах рождения.</Text>
          </VStack>
        </section>
      )}
    </VStack>
  );
}
