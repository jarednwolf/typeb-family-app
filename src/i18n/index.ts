// Lightweight fallback import to avoid missing types; if i18n-js not present, use a minimal shim
let i18n: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  i18n = require('i18n-js');
} catch {
  i18n = {
    t: (k: string, _o?: any) => k,
    locale: 'en',
    fallbacks: true,
    translations: {},
  };
}
import * as Localization from 'expo-localization';
import en from './locales/en';

i18n.fallbacks = true;
i18n.translations = { en };
i18n.locale = Localization.locale || 'en';

export default i18n;


