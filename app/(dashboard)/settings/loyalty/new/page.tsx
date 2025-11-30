'use client';

import { LoyaltyConfigurationForm, LoyaltyConfigurationFormState } from '@/components/loyalty/loyalty-configuration-form';
import { toast } from '@/hooks/use-toast';
import { createLoyaltyConfiguration } from '@/lib/api/loyalty';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewLoyaltyConfigurationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: LoyaltyConfigurationFormState) => {
    try {
      setSubmitting(true);
      await createLoyaltyConfiguration(values);
      toast({
        title: 'Success',
        description: 'Loyalty tier configuration created successfully',
      });
      router.push('/settings/loyalty');
    } catch (error) {
      console.error('Failed to create configuration:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create configuration',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Loyalty Tier</h1>
        <p className="text-muted-foreground">
          Define a new loyalty tier configuration with benefits and requirements
        </p>
      </div>
      <LoyaltyConfigurationForm
        submitting={submitting}
        submitLabel="Create Tier"
        onCancelHref="/settings/loyalty"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
