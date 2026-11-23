// «Назад» на телефоне закрывает открытый лист, а не уводит со страницы.

import {useEffect, useRef} from 'react';

export function useSheetBack(isOpen: boolean, onClose: () => void) {
  const pushed = useRef(false);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (isOpen && !pushed.current) {
      history.pushState({sheet: true}, '');
      pushed.current = true;
    }
    if (!isOpen && pushed.current) {
      pushed.current = false;
      history.back();
    }
  }, [isOpen]);

  useEffect(() => {
    const onPop = () => {
      if (!pushed.current) return;
      pushed.current = false;
      close.current();
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
}
