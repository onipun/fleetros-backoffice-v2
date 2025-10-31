'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

export default function NotificationDemoPage() {
  const { toast, success, error, warning, info } = useToast();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Notification System</h1>
        <p className="text-muted-foreground mt-2">
          Professional toast notifications with distinct styling for different message types
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Success Notifications */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-green-700 dark:text-green-300">Success Notifications</CardTitle>
            </div>
            <CardDescription>
              Used for successful operations, completions, and positive confirmations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => success('Operation Successful', 'Your changes have been saved successfully.')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Show Success Toast
            </Button>
            <Button
              onClick={() => 
                toast({
                  variant: 'success',
                  title: 'Payment Processed',
                  description: 'Payment of $299.00 has been processed successfully.',
                })
              }
              variant="outline"
              className="w-full border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950"
            >
              Payment Success
            </Button>
            <Button
              onClick={() => 
                toast({
                  variant: 'success',
                  title: 'Vehicle Added',
                  description: 'New vehicle "Toyota Camry 2024" has been added to your fleet.',
                })
              }
              variant="outline"
              className="w-full border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950"
            >
              Vehicle Created
            </Button>
          </CardContent>
        </Card>

        {/* Error Notifications */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-700 dark:text-red-300">Error Notifications</CardTitle>
            </div>
            <CardDescription>
              Used for errors, failures, and critical issues that need attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => error('Operation Failed', 'Unable to complete your request. Please try again.')}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Show Error Toast
            </Button>
            <Button
              onClick={() => 
                toast({
                  variant: 'destructive',
                  title: 'Payment Failed',
                  description: 'Your payment could not be processed. Please check your payment details.',
                })
              }
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
            >
              Payment Error
            </Button>
            <Button
              onClick={() => 
                toast({
                  variant: 'destructive',
                  title: 'Connection Error',
                  description: 'Failed to connect to the server. Please check your internet connection.',
                })
              }
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
            >
              Network Error
            </Button>
          </CardContent>
        </Card>

        {/* Warning Notifications */}
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-yellow-700 dark:text-yellow-300">Warning Notifications</CardTitle>
            </div>
            <CardDescription>
              Used for warnings, cautions, and actions that need user attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => warning('Action Required', 'Please complete your profile to continue.')}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              Show Warning Toast
            </Button>
            <Button
              onClick={() => 
                toast({
                  variant: 'warning',
                  title: 'Low Stock Alert',
                  description: 'Only 2 vehicles remain in this category. Consider adding more inventory.',
                })
              }
              variant="outline"
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-950"
            >
              Low Stock Warning
            </Button>
            <Button
              onClick={() => 
                toast({
                  variant: 'warning',
                  title: 'Maintenance Due',
                  description: 'Vehicle "Honda Civic" is due for maintenance in 3 days.',
                })
              }
              variant="outline"
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-950"
            >
              Maintenance Warning
            </Button>
          </CardContent>
        </Card>

        {/* Info Notifications */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-blue-700 dark:text-blue-300">Info Notifications</CardTitle>
            </div>
            <CardDescription>
              Used for informational messages, tips, and general updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => info('New Feature Available', 'Check out our new booking analytics dashboard.')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Show Info Toast
            </Button>
            <Button
              onClick={() => 
                toast({
                  variant: 'info',
                  title: 'System Update',
                  description: 'A system update will be performed tonight at 2:00 AM.',
                })
              }
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950"
            >
              System Update
            </Button>
            <Button
              onClick={() => 
                toast({
                  variant: 'info',
                  title: 'Tip',
                  description: 'You can use keyboard shortcuts to navigate faster. Press ? to see all shortcuts.',
                })
              }
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950"
            >
              Show Tip
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Multiple Toasts Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Multiple Notifications</CardTitle>
          <CardDescription>
            Test showing multiple notifications at once (max 5 visible)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => {
              success('First Success', 'This is the first notification');
              setTimeout(() => info('Second Info', 'This is the second notification'), 200);
              setTimeout(() => warning('Third Warning', 'This is the third notification'), 400);
              setTimeout(() => error('Fourth Error', 'This is the fourth notification'), 600);
              setTimeout(() => success('Fifth Success', 'This is the fifth notification'), 800);
            }}
            className="w-full"
          >
            Show 5 Notifications
          </Button>
          <Button
            onClick={() => {
              success('Quick Message 1');
              setTimeout(() => success('Quick Message 2'), 100);
              setTimeout(() => success('Quick Message 3'), 200);
            }}
            variant="outline"
            className="w-full"
          >
            Show Quick Succession
          </Button>
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Guide</CardTitle>
          <CardDescription>
            How to use the toast notification system in your code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Import the hook:</h3>
              <code className="text-sm">
                {`import { useToast } from '@/hooks/use-toast';`}
              </code>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Use in component:</h3>
              <pre className="text-sm overflow-x-auto">
{`const { success, error, warning, info } = useToast();

// Success notification
success('Title', 'Description');

// Error notification
error('Title', 'Description');

// Warning notification
warning('Title', 'Description');

// Info notification
info('Title', 'Description');`}
              </pre>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Advanced usage with custom options:</h3>
              <pre className="text-sm overflow-x-auto">
{`const { toast } = useToast();

toast({
  variant: 'success',
  title: 'Custom Title',
  description: 'Custom description',
  duration: 5000, // milliseconds
});`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
