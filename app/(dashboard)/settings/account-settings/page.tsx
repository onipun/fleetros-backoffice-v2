'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
    createAccountSetting,
    deleteAccountSetting,
    getAllAccountSettings,
    isValidSettingKey,
    isValidSettingValue,
    updateAccountSetting,
    type Currency,
} from '@/lib/api/account-settings';
import type { AccountSetting } from '@/types';
import { Check, DollarSign, Edit, Plus, Settings, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const SETTING_OPTIONS = [
  { value: 'taxRate', label: 'Tax Rate' },
  { value: 'serviceFeeRate', label: 'Service Fee Rate' },
];

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<AccountSetting | null>(null);
  const [formData, setFormData] = useState({
    settingKey: '',
    settingValue: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [isCurrencySaving, setIsCurrencySaving] = useState(false);

  // Update selected currency when context changes
  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

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

  const handleOpenDialog = (setting?: AccountSetting) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData({
        settingKey: setting.settingKey,
        settingValue: setting.settingValue,
        description: setting.description || '',
      });
    } else {
      setEditingSetting(null);
      setFormData({ settingKey: '', settingValue: '', description: '' });
    }
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSetting(null);
    setFormData({ settingKey: '', settingValue: '', description: '' });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.settingKey.trim()) {
      newErrors.settingKey = 'Setting key is required';
    } else if (!isValidSettingKey(formData.settingKey)) {
      newErrors.settingKey = 'Key must be alphanumeric with underscores/hyphens (1-100 chars)';
    }

    if (!formData.settingValue.trim()) {
      newErrors.settingValue = 'Setting value is required';
    } else if (!isValidSettingValue(formData.settingValue)) {
      newErrors.settingValue = 'Value must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingSetting) {
        // Update existing setting
        await updateAccountSetting(editingSetting.settingKey, {
          settingValue: formData.settingValue,
        });
        toast({
          title: 'Success',
          description: 'Setting updated successfully',
        });
      } else {
        // Create new setting
        await createAccountSetting({
          settingKey: formData.settingKey,
          settingValue: formData.settingValue,
        });
        toast({
          title: 'Success',
          description: 'Setting created successfully',
        });
      }

      handleCloseDialog();
      loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingSetting ? 'update' : 'create'} setting`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the setting "${key}"?`)) {
      return;
    }

    try {
      await deleteAccountSetting(key);
      toast({
        title: 'Success',
        description: 'Setting deleted successfully',
      });
      loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete setting',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <Button onClick={() => handleOpenDialog()} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Setting
        </Button>
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

      {/* Settings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      ) : settings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No settings configured yet</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Setting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {settings.map((setting) => (
            <Card key={setting.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-mono">
                      {setting.settingKey}
                    </CardTitle>
                    {setting.description && (
                      <CardDescription>{setting.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(setting)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(setting.settingKey)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Value</Label>
                    <div className="mt-1 p-3 rounded-md bg-muted font-mono text-sm">
                      {setting.settingValue}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created: {formatDate(setting.createdAt)}</span>
                    <span>Updated: {formatDate(setting.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingSetting ? 'Edit Setting' : 'Create New Setting'}
              </DialogTitle>
              <DialogDescription>
                {editingSetting
                  ? 'Update the setting value and description'
                  : 'Add a new configuration setting for your account'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Setting Key */}
              <div className="space-y-2">
                <Label htmlFor="settingKey">
                  Setting Type <span className="text-destructive">*</span>
                </Label>
                {editingSetting ? (
                  <Input
                    id="settingKey"
                    value={SETTING_OPTIONS.find(opt => opt.value === formData.settingKey)?.label || formData.settingKey}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Select
                    value={formData.settingKey}
                    onValueChange={(value) =>
                      setFormData({ ...formData, settingKey: value })
                    }
                  >
                    <SelectTrigger
                      className={errors.settingKey ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder="Select a setting type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SETTING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.settingKey && (
                  <p className="text-sm text-destructive">{errors.settingKey}</p>
                )}
              </div>

              {/* Setting Value */}
              <div className="space-y-2">
                <Label htmlFor="settingValue">
                  Setting Value <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="settingValue"
                  value={formData.settingValue}
                  onChange={(e) =>
                    setFormData({ ...formData, settingValue: e.target.value })
                  }
                  placeholder="e.g., 0.15, USD, 365"
                  className={errors.settingValue ? 'border-destructive' : ''}
                />
                {errors.settingValue && (
                  <p className="text-sm text-destructive">{errors.settingValue}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum 500 characters
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit">
                {editingSetting ? 'Update' : 'Create'} Setting
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
