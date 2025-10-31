'use client';

import { EventCalendar } from '@/components/dashboard/event-calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMerchantStatus } from '@/lib/api/stripe-onboarding';
import { AlertCircle, Car, CreditCard, DollarSign, FileText, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);
  const [isLoadingMerchantStatus, setIsLoadingMerchantStatus] = useState(true);

  useEffect(() => {
    const checkMerchantStatus = async () => {
      try {
        // Get user account ID from /api/auth/me
        const authResponse = await fetch('/api/auth/me');
        
        if (!authResponse.ok) {
          return; // User not authenticated, don't show banner
        }

        const userData = await authResponse.json();
        
        if (!userData.authenticated || !userData.accountId) {
          return;
        }

        // Check merchant status
        try {
          const merchantStatus = await getMerchantStatus();
          
          // Show banner if merchant doesn't exist or can't accept payments
          if (!merchantStatus.success || !merchantStatus.canAcceptPayments) {
            setShowPaymentBanner(true);
          }
        } catch (error: any) {
          // If 404 (merchant not found), show banner
          if (error.status === 404) {
            setShowPaymentBanner(true);
          }
        }
      } catch (error) {
        console.error('Error checking merchant status:', error);
      } finally {
        setIsLoadingMerchantStatus(false);
      }
    };

    checkMerchantStatus();
  }, []);
  const stats = [
    {
      title: 'Total Vehicles',
      value: '124',
      icon: Car,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Bookings',
      value: '45',
      icon: FileText,
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Total Revenue',
      value: '$52,340',
      icon: DollarSign,
      trend: '+23%',
      trendUp: true,
    },
    {
      title: 'Active Packages',
      value: '12',
      icon: Package,
      trend: '-2%',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your fleet.
        </p>
      </div>

      {/* Payment Setup Banner */}
      {showPaymentBanner && !isLoadingMerchantStatus && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Enable Payment Processing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up your payment account to start accepting payments from customers. 
                  Process credit cards, manage payouts, and track earnings.
                </p>
                <Button onClick={() => router.push('/payments/onboarding')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Enable Payments
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaymentBanner(false)}
              >
                <AlertCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p
                className={`text-xs ${
                  stat.trendUp ? 'text-success' : 'text-destructive'
                }`}
              >
                {stat.trend} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EventCalendar />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Booking #{1000 + i}</p>
                    <p className="text-sm text-muted-foreground">
                      Tesla Model 3 - John Doe
                    </p>
                  </div>
                  <div className="text-sm font-medium">$450.00</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
              Add New Vehicle
            </button>
            <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
              Create Booking
            </button>
            <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
              Manage Discounts
            </button>
            <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
              View Reports
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
