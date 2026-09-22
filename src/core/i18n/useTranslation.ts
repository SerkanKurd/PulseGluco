import { translations, SupportedLocale, Translations } from './translations';
import { useHealthStore } from '../../presentation/state/useHealthStore';

export function useTranslation(): {
  t: Translations;
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
} {
  const locale = useHealthStore((state) => state.locale);
  const setLocale = useHealthStore((state) => state.setLocale);

  return {
    t: translations[locale] || translations.en,
    locale,
    setLocale,
  };
}
