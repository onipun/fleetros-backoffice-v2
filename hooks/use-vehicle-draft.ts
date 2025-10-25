'use client';

import type { PricingFormData } from '@/components/pricing/pricing-panel';
import type { Vehicle } from '@/types';
import { useCallback, useEffect, useState } from 'react';

const DRAFT_KEY = 'vehicle-form-draft';
const DRAFT_TIMESTAMP_KEY = 'vehicle-form-draft-timestamp';

export interface VehicleDraft {
  formData: Partial<Vehicle>;
  pricingData: PricingFormData;
  currentStep: number;
  timestamp: number;
}

export function useVehicleDraft() {
  const [hasDraft, setHasDraft] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if draft exists on mount
  useEffect(() => {
    const checkDraft = () => {
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);
        
        if (draft && timestamp) {
          const draftAge = Date.now() - parseInt(timestamp, 10);
          // Only consider drafts less than 7 days old
          if (draftAge < 7 * 24 * 60 * 60 * 1000) {
            setHasDraft(true);
          } else {
            // Clear old draft
            clearDraft();
          }
        }
      } catch (error) {
        console.error('Error checking draft:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkDraft();
  }, []);

  const saveDraft = useCallback((draft: VehicleDraft) => {
    try {
      const draftWithTimestamp = {
        ...draft,
        timestamp: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftWithTimestamp));
      localStorage.setItem(DRAFT_TIMESTAMP_KEY, Date.now().toString());
      setHasDraft(true);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, []);

  const loadDraft = useCallback((): VehicleDraft | null => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        return JSON.parse(draft);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return null;
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
      setHasDraft(false);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, []);

  const getDraftTimestamp = useCallback((): Date | null => {
    try {
      const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);
      if (timestamp) {
        return new Date(parseInt(timestamp, 10));
      }
    } catch (error) {
      console.error('Error getting draft timestamp:', error);
    }
    return null;
  }, []);

  return {
    hasDraft,
    isChecking,
    saveDraft,
    loadDraft,
    clearDraft,
    getDraftTimestamp,
  };
}
