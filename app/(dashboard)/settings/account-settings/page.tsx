'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
    createAccountSetting,
    getAllAccountSettings,
    getDepositSettings,
    updateAccountSetting,
    updateDepositSettings,
    type Currency,
    type DepositSettings,
    type DepositType,
} from '@/lib/api/account-settings';
import type { AccountSetting } from '@/types';
import { Check, DollarSign, FileText, Percent, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';

const CURRENCIES = [
  { code: 'USD' as Currency, name: 'US Dollar', symbol: '$' },
  { code: 'MYR' as Currency, name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'CNY' as Currency, name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD' as Currency, name: 'Singapore Dollar', symbol: 'S$' },
];

export default function AccountSettingsPage() {
  const { currency, setCurrency, t } = useLocale();
  const [settings, setSettings] = useState<AccountSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [isCurrencySaving, setIsCurrencySaving] = useState(false);

  // Deposit settings state
  const [depositSettings, setDepositSettings] = useState<DepositSettings>({
    depositType: 'PERCENTAGE',
    depositRate: '0.20',
  });
  const [isDepositSaving, setIsDepositSaving] = useState(false);
  const [depositLoading, setDepositLoading] = useState(true);

  // Tax Rate state
  const [taxRate, setTaxRate] = useState('0.00');
  const [isTaxRateSaving, setIsTaxRateSaving] = useState(false);

  // Service Fee Rate state
  const [serviceFeeRate, setServiceFeeRate] = useState('0.00');
  const [isServiceFeeSaving, setIsServiceFeeSaving] = useState(false);

  // Update selected currency when context changes
  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadDepositSettings();
  }, []);

  const loadDepositSettings = async () => {
    try {
      setDepositLoading(true);
      const data = await getDepositSettings();
      setDepositSettings(data);
    } catch (error: any) {
      console.error('Error loading deposit settings:', error);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleDepositTypeChange = async (newType: DepositType) => {
    const newSettings = { ...depositSettings, depositType: newType };
    setDepositSettings(newSettings);
    await saveDepositSettings(newSettings);
  };

  const handleDepositRateChange = (value: string) => {
    // Allow typing decimal numbers
    if (/^\d*\.?\d*$/.test(value)) {
      setDepositSettings({ ...depositSettings, depositRate: value });
    }
  };

  const handleDepositRateBlur = async () => {
    // Validate and save on blur
    const rate = parseFloat(depositSettings.depositRate);
    if (isNaN(rate) || rate < 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid deposit rate',
        variant: 'destructive',
      });
      return;
    }
    
    // Format the rate properly
    const formattedRate = depositSettings.depositType === 'PERCENTAGE' 
      ? rate.toFixed(2) 
      : rate.toFixed(2);
    
    const newSettings = { ...depositSettings, depositRate: formattedRate };
    setDepositSettings(newSettings);
    await saveDepositSettings(newSettings);
  };

  const saveDepositSettings = async (settings: DepositSettings) => {
    setIsDepositSaving(true);
    try {
      await updateDepositSettings(settings);
      toast({
        title: 'Success',
        description: 'Deposit settings updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update deposit settings',
        variant: 'destructive',
      });
    } finally {
      setIsDepositSaving(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const handleCurrencyChange = async (newCurrency: Currency) => {
    setSelectedCurrency(newCurrency);
    setIsCurrencySaving(true);
    try {
      await setCurrency(newCurrency);
      toast({
        title: 'Success',
        description: 'Currency updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update currency',
        variant: 'destructive',
      });
    } finally {
      setIsCurrencySaving(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getAllAccountSettings();
      setSettings(data);
      
      // Extract tax rate and service fee rate from settings
      const taxRateSetting = data.find(s => s.settingKey === 'taxRate');
      const serviceFeeSetting = data.find(s => s.settingKey === 'serviceFeeRate');
      
      if (taxRateSetting) {
        setTaxRate(taxRateSetting.settingValue);
      }
      if (serviceFeeSetting) {
        setServiceFeeRate(serviceFeeSetting.settingValue);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load account settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Tax Rate handlers
  const handleTaxRateChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setTaxRate(value);
    }
  };

  const handleTaxRateBlur = async () => {
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 1) {
      toast({
        title: 'Error',
        description: 'Please enter a valid tax rate between 0 and 1',
        variant: 'destructive',
      });
      return;
    }
    
    const formattedRate = rate.toFixed(2);
    setTaxRate(formattedRate);
    await saveTaxRate(formattedRate);
  };

  const saveTaxRate = async (value: string) => {
    setIsTaxRateSaving(true);
    try {
      const existing = settings.find(s => s.settingKey === 'taxRate');
      if (existing) {
        await updateAccountSetting('taxRate', { settingValue: value });
      } else {
        await createAccountSetting({ settingKey: 'taxRate', settingValue: value });
      }
      toast({
        title: 'Success',
        description: 'Tax rate updated successfully',
      });
      loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update tax rate',
        variant: 'destructive',
      });
    } finally {
      setIsTaxRateSaving(false);
    }
  };

  // Service Fee Rate handlers
  const handleServiceFeeRateChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setServiceFeeRate(value);
    }
  };

  const handleServiceFeeRateBlur = async () => {
    const rate = parseFloat(serviceFeeRate);
    if (isNaN(rate) || rate < 0 || rate > 1) {
      toast({
        title: 'Error',
        description: 'Please enter a valid service fee rate between 0 and 1',
        variant: 'destructive',
      });
      return;
    }
    
    const formattedRate = rate.toFixed(2);
    setServiceFeeRate(formattedRate);
    await saveServiceFeeRate(formattedRate);
  };

  const saveServiceFeeRate = async (value: string) => {
    setIsServiceFeeSaving(true);
    try {
      const existing = settings.find(s => s.settingKey === 'serviceFeeRate');
      if (existing) {
        await updateAccountSetting('serviceFeeRate', { settingValue: value });
      } else {
        await createAccountSetting({ settingKey: 'serviceFeeRate', settingValue: value });
      }
      toast({
        title: 'Success',
        description: 'Service fee rate updated successfully',
      });
      loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update service fee rate',
        variant: 'destructive',
      });
    } finally {
      setIsServiceFeeSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage account-specific configuration settings
          </p>
        </div>
      </div>

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
            {CURRENCIES.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleCurrencyChange(curr.code)}
                disabled={isCurrencySaving}
                className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-primary/50 ${
                  selectedCurrency === curr.code
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                } ${isCurrencySaving ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      {/* Deposit Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            <CardTitle>Booking Deposit</CardTitle>
          </div>
          <CardDescription>
            Configure the default deposit amount required for bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {depositLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="text-muted-foreground">Loading deposit settings...</div>
            </div>
          ) : (
            <>
              {/* Deposit Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Deposit Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDepositTypeChange('PERCENTAGE')}
                    disabled={isDepositSaving}
                    className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-primary/50 ${
                      depositSettings.depositType === 'PERCENTAGE'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    } ${isDepositSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                      <Percent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Percentage</div>
                      <div className="text-xs text-muted-foreground">% of total booking</div>
                    </div>
                    {depositSettings.depositType === 'PERCENTAGE' && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDepositTypeChange('FLAT')}
                    disabled={isDepositSaving}
                    className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-primary/50 ${
                      depositSettings.depositType === 'FLAT'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    } ${isDepositSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Flat Amount</div>
                      <div className="text-xs text-muted-foreground">Fixed deposit amount</div>
                    </div>
                    {depositSettings.depositType === 'FLAT' && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                </div>
              </div>

              {/* Deposit Rate Input */}
              <div className="space-y-2">
                <Label htmlFor="depositRate" className="text-sm font-medium">
                  {depositSettings.depositType === 'PERCENTAGE' ? 'Deposit Rate' : 'Deposit Amount'}
                </Label>
                <div className="relative">
                  <Input
                    id="depositRate"
                    type="text"
                    value={depositSettings.depositRate}
                    onChange={(e) => handleDepositRateChange(e.target.value)}
                    onBlur={handleDepositRateBlur}
                    disabled={isDepositSaving}
                    className={`pr-12 ${isDepositSaving ? 'opacity-50' : ''}`}
                    placeholder={depositSettings.depositType === 'PERCENTAGE' ? '0.20' : '100.00'}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                    {depositSettings.depositType === 'PERCENTAGE' ? '%' : selectedCurrency}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {depositSettings.depositType === 'PERCENTAGE' 
                    ? 'Enter as decimal (e.g., 0.20 for 20%)' 
                    : `Enter the fixed deposit amount in ${selectedCurrency}`}
                </p>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="text-sm text-muted-foreground">Current Setting Preview</div>
                <div className="mt-1 font-medium">
                  {depositSettings.depositType === 'PERCENTAGE' 
                    ? `${(parseFloat(depositSettings.depositRate) * 100).toFixed(0)}% of booking total`
                    : `${selectedCurrency} ${parseFloat(depositSettings.depositRate).toFixed(2)} flat deposit`}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tax Rate & Service Fee Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tax Rate Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <CardTitle>Tax Rate</CardTitle>
            </div>
            <CardDescription>
              Configure the tax rate applied to bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : (
              <>
                {/* Tax Rate Input */}
                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="text-sm font-medium">
                    Tax Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="taxRate"
                      type="text"
                      value={taxRate}
                      onChange={(e) => handleTaxRateChange(e.target.value)}
                      onBlur={handleTaxRateBlur}
                      disabled={isTaxRateSaving}
                      className={`pr-12 ${isTaxRateSaving ? 'opacity-50' : ''}`}
                      placeholder="0.06"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                      %
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter as decimal (e.g., 0.06 for 6%)
                  </p>
                </div>

                {/* Preview */}
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="text-sm text-muted-foreground">Current Setting</div>
                  <div className="mt-1 font-medium">
                    {(parseFloat(taxRate || '0') * 100).toFixed(0)}% tax on booking total
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Service Fee Rate Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Service Fee Rate</CardTitle>
            </div>
            <CardDescription>
              Configure the service fee rate applied to bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : (
              <>
                {/* Service Fee Rate Input */}
                <div className="space-y-2">
                  <Label htmlFor="serviceFeeRate" className="text-sm font-medium">
                    Service Fee Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="serviceFeeRate"
                      type="text"
                      value={serviceFeeRate}
                      onChange={(e) => handleServiceFeeRateChange(e.target.value)}
                      onBlur={handleServiceFeeRateBlur}
                      disabled={isServiceFeeSaving}
                      className={`pr-12 ${isServiceFeeSaving ? 'opacity-50' : ''}`}
                      placeholder="0.05"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                      %
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter as decimal (e.g., 0.05 for 5%)
                  </p>
                </div>

                {/* Preview */}
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="text-sm text-muted-foreground">Current Setting</div>
                  <div className="mt-1 font-medium">
                    {(parseFloat(serviceFeeRate || '0') * 100).toFixed(0)}% service fee on booking total
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
