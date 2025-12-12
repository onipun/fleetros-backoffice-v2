'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, Award, Check, CreditCard, DollarSign, Globe, Palette, Settings as SettingsIcon, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type Locale = 'en' | 'zh' | 'ms';
type Currency = 'USD' | 'MYR' | 'CNY' | 'SGD';

export default function SettingsPage() {
  const { locale, setLocale, t, currency, setCurrency } = useLocale();
  const { theme, setTheme } = useTheme();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [selectedTheme, setSelectedTheme] = useState(theme);

  const languages = [
    { code: 'en' as Locale, name: t('settings.language.en'), flag: '🇬🇧' },
    { code: 'zh' as Locale, name: t('settings.language.zh'), flag: '🇨🇳' },
    { code: 'ms' as Locale, name: t('settings.language.ms'), flag: '🇲🇾' },
  ];

  const currencies = [
    { code: 'USD' as Currency, name: t('settings.currency.usd'), symbol: '$' },
    { code: 'MYR' as Currency, name: t('settings.currency.myr'), symbol: 'RM' },
    { code: 'CNY' as Currency, name: t('settings.currency.cny'), symbol: '¥' },
    { code: 'SGD' as Currency, name: t('settings.currency.sgd'), symbol: 'S$' },
  ];

  const themes = [
    { value: 'light', name: t('settings.theme.light'), icon: '☀️' },
    { value: 'dark', name: t('settings.theme.dark'), icon: '🌙' },
    { value: 'system', name: t('settings.theme.system'), icon: '💻' },
  ];

  const handleSave = () => {
    setLocale(selectedLocale);
    setCurrency(selectedCurrency);
    setTheme(selectedTheme);
    
    toast({
      title: t('common.success'),
      description: t('settings.saveSuccess'),
    });
  };

  const hasChanges = 
    selectedLocale !== locale || 
    selectedCurrency !== currency || 
    selectedTheme !== theme;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Quick Access Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Account Settings - Quick Access */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                <CardTitle>Account Settings</CardTitle>
              </div>
              <CardDescription>
                Manage account-specific configuration settings like tax rates and fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/account-settings">
                <Button className="w-full">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Manage Settings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Payment Account Settings - Quick Access */}
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-500" />
                <CardTitle>{t('settings.paymentAccount.title') || 'Payment Account'}</CardTitle>
              </div>
              <CardDescription>
                {t('settings.paymentAccount.description') || 'Manage Stripe payment processing'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/payment-account">
                <Button className="w-full" variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t('settings.paymentAccount.manage') || 'Manage'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Modification Policies - Quick Access */}
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <CardTitle>Modification Policies</CardTitle>
              </div>
              <CardDescription>
                Configure booking modification rules and fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/modification-policies">
                <Button className="w-full" variant="outline">
                  <Shield className="mr-2 h-4 w-4" />
                  Manage Policies
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Loyalty Program - Quick Access */}
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <CardTitle>Loyalty Program</CardTitle>
              </div>
              <CardDescription>
                Configure loyalty tiers, rewards, and customer benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/loyalty">
                <Button className="w-full" variant="outline">
                  <Award className="mr-2 h-4 w-4" />
                  Manage Loyalty Tiers
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>{t('settings.language.title')}</CardTitle>
            </div>
            <CardDescription>{t('settings.language.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLocale(lang.code)}
                  className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-primary/50 ${
                    selectedLocale === lang.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-xs text-muted-foreground uppercase">{lang.code}</div>
                  </div>
                  {selectedLocale === lang.code && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>{t('settings.currency.title')}</CardTitle>
            </div>
            <CardDescription>{t('settings.currency.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => setSelectedCurrency(curr.code)}
                  className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-primary/50 ${
                    selectedCurrency === curr.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-lg font-bold">
                    {curr.symbol}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{curr.name}</div>
                    <div className="text-xs text-muted-foreground">{curr.code}</div>
                  </div>
                  {selectedCurrency === curr.code && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>{t('settings.theme.title')}</CardTitle>
            </div>
            <CardDescription>{t('settings.theme.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => setSelectedTheme(themeOption.value as any)}
                  className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-primary/50 ${
                    selectedTheme === themeOption.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <span className="text-3xl">{themeOption.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{themeOption.name}</div>
                  </div>
                  {selectedTheme === themeOption.value && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            size="lg"
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
