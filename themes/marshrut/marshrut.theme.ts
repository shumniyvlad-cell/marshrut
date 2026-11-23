// The marshrut theme. `astryx experimental theme editor` wrote this file once and never changes it again.
// The checked settings live in marshrut.settings.json and the generated marshrut.settings.ts;
// change them with `astryx experimental theme editor set marshrut ...`. Add your own changes below: they win over the settings.
import {defineTheme} from '@astryxdesign/core/theme';
import {marshrutSettings} from './marshrut.settings';

export const marshrutTheme = defineTheme({
  extends: marshrutSettings,
  name: 'marshrut',
});
