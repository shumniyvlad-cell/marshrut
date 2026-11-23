import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@fontsource-variable/ysabeau/wght.css';
import '@fontsource-variable/ysabeau/wght-italic.css';
import '@fontsource-variable/ysabeau-office/wght.css';
import './app.css';
import {Theme} from '@astryxdesign/core/theme';
import {LayerProvider} from '@astryxdesign/core/Layer';
import {InternationalizationProvider} from '@astryxdesign/core/i18n';
import ruRU from '@astryxdesign/core/locales/ru-RU.generated.js';
import {themes, defaultThemeSlug} from './astryx-themes';
import {useStore} from './store';
import App from './App';

// Тема: 'system' — как в системе; эксперт меняет её в настройках.
function Root() {
  const {mode} = useStore();
  return (
    <Theme theme={themes[defaultThemeSlug]} mode={mode}>
      <LayerProvider>
        <App />
      </LayerProvider>
    </Theme>
  );
}

// ?motion=1 — показать движение даже при «Уменьшить движение» в системе (так смотрит Влад на маке).
if (new URLSearchParams(location.search).has('motion')) document.documentElement.dataset.motion = '1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InternationalizationProvider locale="ru-RU" messages={{'ru-RU': ruRU}}>
      <Root />
    </InternationalizationProvider>
  </StrictMode>,
);
