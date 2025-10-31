'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CheckCircle2, Mail, Phone, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof formSchema>;

export default function FormValidationDemoPage() {
  const { success, error: toastError } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    success('Form Submitted', 'Your information has been received successfully.');
    reset();
  };

  const triggerValidation = () => {
    handleSubmit(
      () => {},
      () => {
        toastError('Validation Failed', 'Please fix the errors in the form before submitting.');
      }
    )();
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Form Validation Demo</h1>
        <p className="text-muted-foreground mt-2">
          Professional form error display with clear visual feedback
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Demo Form */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Form</CardTitle>
            <CardDescription>
              Try submitting the form with invalid data to see error states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <FormField
                label="Full Name"
                htmlFor="name"
                icon={<User className="h-4 w-4" />}
                required
                error={errors.name?.message}
              >
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register('name')}
                  error={!!errors.name}
                />
              </FormField>

              {/* Email Field */}
              <FormField
                label="Email Address"
                htmlFor="email"
                icon={<Mail className="h-4 w-4" />}
                required
                error={errors.email?.message}
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register('email')}
                  error={!!errors.email}
                />
              </FormField>

              {/* Phone Field */}
              <FormField
                label="Phone Number"
                htmlFor="phone"
                icon={<Phone className="h-4 w-4" />}
                required
                error={errors.phone?.message}
                hint="International format: +60123456789"
              >
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+60123456789"
                  {...register('phone')}
                  error={!!errors.phone}
                />
              </FormField>

              {/* Company Field */}
              <FormField
                label="Company"
                htmlFor="company"
                icon={<Building2 className="h-4 w-4" />}
                error={errors.company?.message}
              >
                <Input
                  id="company"
                  placeholder="Acme Inc."
                  {...register('company')}
                  error={!!errors.company}
                />
              </FormField>

              {/* Message Field */}
              <FormField
                label="Message"
                htmlFor="message"
                required
                error={errors.message?.message}
              >
                <Textarea
                  id="message"
                  placeholder="Your message here..."
                  {...register('message')}
                  error={!!errors.message}
                  rows={4}
                />
              </FormField>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Form'}
                </Button>
                <Button type="button" variant="outline" onClick={() => reset()}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error States Demo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Error State Features</CardTitle>
              <CardDescription>
                Professional error display components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Visual Indicators
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Red border on invalid inputs</li>
                  <li>• Red background tint on invalid inputs</li>
                  <li>• Alert icon with error message</li>
                  <li>• Red label color when field has error</li>
                  <li>• Smooth animation when error appears</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  User Experience
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Errors show immediately after field blur</li>
                  <li>• Clear, specific error messages</li>
                  <li>• Required fields marked with red asterisk</li>
                  <li>• Hint text for proper formatting</li>
                  <li>• Accessible with ARIA attributes</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Developer Features
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Consistent FormField component</li>
                  <li>• React Hook Form integration</li>
                  <li>• Zod schema validation</li>
                  <li>• Type-safe error handling</li>
                  <li>• Reusable across all forms</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Try It Out</CardTitle>
              <CardDescription>
                Test different validation scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={triggerValidation}
                variant="outline"
                className="w-full"
              >
                Trigger Validation (Empty Form)
              </Button>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">Test Cases:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Try submitting empty form</li>
                  <li>• Enter 1 character in name field</li>
                  <li>• Enter invalid email format</li>
                  <li>• Enter phone without +</li>
                  <li>• Enter less than 10 chars in message</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="text-blue-700 dark:text-blue-300">Usage Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-x-auto">
{`import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

<FormField
  label="Email"
  htmlFor="email"
  icon={<Mail className="h-4 w-4" />}
  required
  error={errors.email?.message}
  hint="We'll never share your email"
>
  <Input
    id="email"
    type="email"
    {...register('email')}
    error={!!errors.email}
  />
</FormField>`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error State Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Error Display Examples</CardTitle>
          <CardDescription>
            Visual examples of different error states
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold">Input with Error</h3>
            <FormField
              label="Email Address"
              htmlFor="example-email"
              icon={<Mail className="h-4 w-4" />}
              required
              error="Invalid email address"
            >
              <Input
                id="example-email"
                type="email"
                defaultValue="invalid-email"
                error={true}
              />
            </FormField>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Input without Error</h3>
            <FormField
              label="Email Address"
              htmlFor="example-email-valid"
              icon={<Mail className="h-4 w-4" />}
              required
              hint="Valid email format"
            >
              <Input
                id="example-email-valid"
                type="email"
                defaultValue="john@example.com"
              />
            </FormField>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Textarea with Error</h3>
            <FormField
              label="Message"
              htmlFor="example-message"
              required
              error="Message must be at least 10 characters"
            >
              <Textarea
                id="example-message"
                defaultValue="Short"
                error={true}
                rows={3}
              />
            </FormField>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Optional Field with Hint</h3>
            <FormField
              label="Company"
              htmlFor="example-company"
              icon={<Building2 className="h-4 w-4" />}
              hint="Optional - enter your company name"
            >
              <Input
                id="example-company"
                placeholder="Acme Inc."
              />
            </FormField>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
