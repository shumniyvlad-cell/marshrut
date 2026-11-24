// Встроенный браузер Telegram не умеет печать и скачивание: подсказываем открыть в Safari или Chrome.
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {useToast} from '@astryxdesign/core/Toast';
import {LinkIcon} from '@heroicons/react/24/outline';
import type {Person} from './engine';
import {shareUrl} from './store';

export const inTelegram = () =>
  typeof navigator !== 'undefined' && (/Telegram/i.test(navigator.userAgent) || 'TelegramWebviewProxy' in window || new URLSearchParams(location.search).has('tg'));

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const t = document.createElement('textarea');
    t.value = text;
    t.setAttribute('readonly', '');
    t.style.position = 'fixed';
    t.style.opacity = '0';
    document.body.append(t);
    t.select();
    const ok = document.execCommand('copy');
    t.remove();
    return ok;
  }
}

export function TgHint({person, what = 'PDF'}: {person: Person; what?: string}) {
  const toast = useToast();
  if (!inTelegram()) return null;
  const onCopy = async () => {
    const ok = await copy(shareUrl(person));
    toast(ok
      ? {body: 'Ссылка скопирована. Вставь её в Safari или Chrome'}
      : {body: 'Не получилось скопировать. Нажми «⋯» вверху и выбери «Открыть в браузере»', type: 'error'});
  };
  return (
    <HStack gap={3} vAlign="center" wrap="wrap" className="tg-hint no-print" role="note">
      <Text weight="semibold" textWrap="pretty">Открой в Safari или Chrome, чтобы сохранить {what}</Text>
      <Button label="Скопировать ссылку" variant="secondary" size="sm" icon={<LinkIcon />} onClick={onCopy} />
    </HStack>
  );
}
