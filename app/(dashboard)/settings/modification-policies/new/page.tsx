'use client';

import { ModificationPolicyForm, ModificationPolicyFormState } from '@/components/modification-policy/modification-policy-form';
import { toast } from '@/hooks/use-toast';
import { createModificationPolicy } from '@/lib/api/modification-policies';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewModificationPolicyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: ModificationPolicyFormState) => {
    try {
      setSubmitting(true);
      await createModificationPolicy(values);
      toast({
        title: 'Success',
        description: 'Modification policy created successfully',
      });
      router.push('/settings/modification-policies');
    } catch (error) {
      console.error('Failed to create policy:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create policy',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Modification Policy</h1>
        <p className="text-muted-foreground">
          Define a new modification policy for bookings
        </p>
      </div>
      <ModificationPolicyForm
        submitting={submitting}
        submitLabel="Create Policy"
        onCancelHref="/settings/modification-policies"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
