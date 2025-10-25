'use client';

import enTranslations from '@/locales/en.json';
import msTranslations from '@/locales/ms.json';
import zhTranslations from '@/locales/zh.json';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Locale = 'en' | 'zh' | 'ms';
type Currency = 'USD' | 'MYR' | 'CNY' | 'SGD';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
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
    // Load saved preferences from localStorage
    const savedLocale = localStorage.getItem('locale') as Locale;
    const savedCurrency = localStorage.getItem('currency') as Currency;
    
    if (savedLocale && ['en', 'zh', 'ms'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
    
    if (savedCurrency && ['USD', 'MYR', 'CNY', 'SGD'].includes(savedCurrency)) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const t = (key: string): string => {
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
    
    return typeof value === 'string' ? value : key;
  };

  const formatCurrency = (amount: number): string => {
    const symbol = currencySymbols[currency];
    return `${symbol}${amount.toFixed(2)}`;
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
