import { z } from 'zod';

/**
 * Validation schema for merchant registration
 * Only collects information NOT in registration flow
 * Based on updated API specification
 */
export const merchantRegistrationSchema = z.object({
  businessAccountId: z.string()
    .min(1, 'Business account ID is required')
    .optional(), // Optional in form, will be added programmatically
  
  businessName: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be less than 100 characters'),
  
  country: z.string()
    .length(2, 'Country must be a 2-letter code (e.g., US, MY)')
    .toUpperCase(),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (use international format)')
    .optional(),
  
  website: z.string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal('')),
});

export type MerchantRegistrationFormData = z.infer<typeof merchantRegistrationSchema>;

/**
 * Default form values
 */
export const defaultRegistrationValues: Partial<MerchantRegistrationFormData> = {
  country: 'MY', // Default to Malaysia
  phone: '',
  website: '',
};
