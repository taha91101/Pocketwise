import { useAppStore } from '../store/useAppStore';
import { I18nService, NumberGroupingFormat } from '../i18n/i18nService';
import { LanguageCode } from '../i18n/translations';

export function useTranslation() {
  const language = useAppStore((state) => state.settings.language || 'en') as LanguageCode;
  const numberGrouping = useAppStore((state) => state.settings.numberGrouping || 'lakhs') as NumberGroupingFormat;
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol || '₹');
  const updateSettings = useAppStore((state) => state.updateSettings);

  const t = (key: string): string => {
    return I18nService.t(key, language);
  };

  const setLanguage = async (newLang: LanguageCode) => {
    await updateSettings({ language: newLang });
  };

  const setNumberGrouping = async (newFormat: NumberGroupingFormat) => {
    await updateSettings({ numberGrouping: newFormat });
  };

  const formatCurrency = (
    amount: number,
    symbol: string = currencySymbol,
    maxFractionDigits: number = 0
  ): string => {
    return I18nService.formatCurrency(amount, symbol, numberGrouping, maxFractionDigits);
  };

  const formatNumber = (amount: number, maxFractionDigits: number = 0): string => {
    return I18nService.formatNumber(amount, numberGrouping, maxFractionDigits);
  };

  return {
    t,
    language,
    setLanguage,
    numberGrouping,
    setNumberGrouping,
    formatCurrency,
    formatNumber,
  };
}

