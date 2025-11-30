'use client';

import { ModificationPolicyForm, ModificationPolicyFormState } from '@/components/modification-policy/modification-policy-form';
import { toast } from '@/hooks/use-toast';
import { getModificationPolicyById, updateModificationPolicy } from '@/lib/api/modification-policies';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

export default function EditModificationPolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<ModificationPolicyFormState | undefined>();

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const policy = await getModificationPolicyById(parseInt(id, 10));
        setInitialData({ ...policy, description: policy.description || '' });
      } catch (error) {
        console.error('Failed to load policy:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load policy',
          variant: 'destructive',
        });
        router.push('/settings/modification-policies');
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, [id, router]);

  const handleSubmit = async (values: ModificationPolicyFormState) => {
    try {
      setSubmitting(true);
      await updateModificationPolicy(parseInt(id, 10), values);
      toast({
        title: 'Success',
        description: 'Modification policy updated successfully',
      });
      router.push('/settings/modification-policies');
    } catch (error) {
      console.error('Failed to update policy:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update policy',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading policy...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Modification Policy</h1>
        <p className="text-muted-foreground">
          Update the modification policy settings
        </p>
      </div>
      <ModificationPolicyForm
        initialData={initialData}
        submitting={submitting}
        submitLabel="Update Policy"
        onCancelHref="/settings/modification-policies"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
