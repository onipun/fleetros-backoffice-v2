'use client';

import { getCurrencySetting, updateCurrencySetting, type Currency } from '@/lib/api/account-settings';
import enTranslations from '@/locales/en.json';
import msTranslations from '@/locales/ms.json';
import zhTranslations from '@/locales/zh.json';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Locale = 'en' | 'zh' | 'ms';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const translations = {
  en: enTranslations,
  zh: zhTranslations,
  ms: msTranslations,
};

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  MYR: 'RM',
  CNY: '¥',
  SGD: 'S$',
};

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [currency, setCurrencyState] = useState<Currency>('MYR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved locale preference from localStorage
    const savedLocale = localStorage.getItem('locale') as Locale;
    
    if (savedLocale && ['en', 'zh', 'ms'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
    
    // Load currency from API
    getCurrencySetting().then((apiCurrency) => {
      if (apiCurrency && ['USD', 'MYR', 'CNY', 'SGD'].includes(apiCurrency)) {
        setCurrencyState(apiCurrency);
      }
    }).catch((error) => {
      console.error('Failed to load currency setting:', error);
    });
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const setCurrency = useCallback(async (newCurrency: Currency) => {
    try {
      await updateCurrencySetting(newCurrency);
      setCurrencyState(newCurrency);
    } catch (error) {
      console.error('Failed to update currency setting:', error);
      // Still update locally even if API fails
      setCurrencyState(newCurrency);
    }
  }, []);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }
    
    let result = typeof value === 'string' ? value : key;
    
    // Replace placeholders like {rateType} with actual values
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      }
    }
    
    return result;
  };

  const formatCurrency = (amount: number): string => {
    const symbol = currencySymbols[currency];
    const safeAmount = amount ?? 0;
    return `${symbol}${safeAmount.toFixed(2)}`;
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, currency, setCurrency, formatCurrency }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
