import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
  // Все компоненты Astryx собираем заранее одним пакетом. Иначе Vite находит новый компонент
  // в отложенном экране на лету, пересобирает зависимости, и в странице оказываются две копии React
  // («Invalid hook call»). Добавил новый компонент — допиши его сюда и перезапусти dev.
  optimizeDeps: {
    include: [
      '@astryxdesign/core/AlertDialog',
      '@astryxdesign/core/AspectRatio',
      '@astryxdesign/core/Avatar',
      '@astryxdesign/core/Badge',
      '@astryxdesign/core/Banner',
      '@astryxdesign/core/BottomSheet',
      '@astryxdesign/core/Button',
      '@astryxdesign/core/Card',
      '@astryxdesign/core/Carousel',
      '@astryxdesign/core/Divider',
      '@astryxdesign/core/EmptyState',
      '@astryxdesign/core/Grid',
      '@astryxdesign/core/HStack',
      '@astryxdesign/core/Heading',
      '@astryxdesign/core/Icon',
      '@astryxdesign/core/Layer',
      '@astryxdesign/core/List',
      '@astryxdesign/core/ProgressBar',
      '@astryxdesign/core/SegmentedControl',
      '@astryxdesign/core/Skeleton',
      '@astryxdesign/core/StatusDot',
      '@astryxdesign/core/Switch',
      '@astryxdesign/core/TabList',
      '@astryxdesign/core/Text',
      '@astryxdesign/core/TextInput',
      '@astryxdesign/core/Thumbnail',
      '@astryxdesign/core/Toast',
      '@astryxdesign/core/Token',
      '@astryxdesign/core/VStack',
      '@astryxdesign/core/i18n',
      '@astryxdesign/core/locales/ru-RU.generated.js',
      '@astryxdesign/core/theme',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      'astronomy-engine',
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
    ],
  },
})
