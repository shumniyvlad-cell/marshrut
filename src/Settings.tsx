// Настройки эксперта: подпись на PDF и обоях, тема.
import {useEffect, useState} from 'react';
import {BottomSheet} from '@astryxdesign/core/BottomSheet';
import {VStack} from '@astryxdesign/core/VStack';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Button} from '@astryxdesign/core/Button';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {useToast} from '@astryxdesign/core/Toast';
import {store, useStore, type Mode} from './store';
import {useSheetBack} from './useSheetBack';

export function Settings({isOpen, onClose}: {isOpen: boolean; onClose: () => void}) {
  const {expert, mode} = useStore();
  const [name, setName] = useState(expert.name);
  const [contact, setContact] = useState(expert.contact);
  const toast = useToast();
  useSheetBack(isOpen, onClose);
  useEffect(() => { if (isOpen) { setName(expert.name); setContact(expert.contact); } }, [isOpen, expert]);

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(o) => !o && onClose()} label="Настройки" purpose="form" height="hug">
      <VStack gap={5} padding={1}>
        <VStack gap={1}>
          <Heading level={2}>Ваша подпись</Heading>
          <Text color="secondary" textWrap="pretty">Появится внизу PDF и на обоях клиента, чтобы он помнил, у кого делал разбор.</Text>
        </VStack>
        <TextInput label="Имя эксперта" value={name} onChange={setName} placeholder="Жанар Сулейменова" />
        <TextInput label="Контакт" value={contact} onChange={setContact} placeholder="@nickname или сайт" isOptional />
        <SegmentedControl label="Тема" value={mode} onChange={(v) => store.setMode(v as Mode)} layout="fill">
          <SegmentedControlItem value="system" label="Как в системе" />
          <SegmentedControlItem value="light" label="Светлая" />
          <SegmentedControlItem value="dark" label="Тёмная" />
        </SegmentedControl>
        <Button
          label="Сохранить" variant="primary" size="lg" width="100%"
          onClick={() => { store.setExpert({name: name.trim(), contact: contact.trim()}); toast({body: 'Подпись сохранена'}); onClose(); }}
        />
      </VStack>
    </BottomSheet>
  );
}
