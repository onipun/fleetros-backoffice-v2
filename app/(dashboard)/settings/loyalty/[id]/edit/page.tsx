'use client';

import { LoyaltyConfigurationForm, LoyaltyConfigurationFormState } from '@/components/loyalty/loyalty-configuration-form';
import { toast } from '@/hooks/use-toast';
import { getAllLoyaltyConfigurations, updateLoyaltyConfiguration } from '@/lib/api/loyalty';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

export default function EditLoyaltyConfigurationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<LoyaltyConfigurationFormState | undefined>();

  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        const configs = await getAllLoyaltyConfigurations();
        const config = configs.find(c => c.id === parseInt(id, 10));
        
        if (!config) {
          throw new Error('Configuration not found');
        }
        
        setInitialData({ ...config, description: config.description || '' });
      } catch (error) {
        console.error('Failed to load configuration:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load configuration',
          variant: 'destructive',
        });
        router.push('/settings/loyalty');
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, [id, router]);

  const handleSubmit = async (values: LoyaltyConfigurationFormState) => {
    try {
      setSubmitting(true);
      await updateLoyaltyConfiguration(parseInt(id, 10), values);
      toast({
        title: 'Success',
        description: 'Loyalty tier configuration updated successfully',
      });
      router.push('/settings/loyalty');
    } catch (error) {
      console.error('Failed to update configuration:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update configuration',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Loyalty Tier</h1>
        <p className="text-muted-foreground">
          Update the loyalty tier configuration settings
        </p>
      </div>
      <LoyaltyConfigurationForm
        initialData={initialData}
        submitting={submitting}
        submitLabel="Update Tier"
        onCancelHref="/settings/loyalty"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
