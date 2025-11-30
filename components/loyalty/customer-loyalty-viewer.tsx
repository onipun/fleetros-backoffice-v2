/**
 * Customer Loyalty Viewer Component
 * View customer loyalty account details and transaction history
 */
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
    getCustomerLoyaltyAccountByEmail,
    getCustomerLoyaltySummary,
    getCustomerLoyaltyTransactions,
} from '@/lib/api/loyalty';
import {
    CustomerLoyaltyAccount,
    CustomerLoyaltySummary,
    LOYALTY_TIER_COLORS,
    LoyaltyTransaction,
} from '@/types/modification-policy';
import { Award, Search, TrendingUp, Trophy } from 'lucide-react';
import { useState } from 'react';

export function CustomerLoyaltyViewer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<CustomerLoyaltyAccount | null>(null);
  const [summary, setSummary] = useState<CustomerLoyaltySummary | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);

  const handleSearch = async () => {
    if (!email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a customer email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const [accountData, summaryData, transactionsData] = await Promise.all([
        getCustomerLoyaltyAccountByEmail(email),
        getCustomerLoyaltySummary(email),
        getCustomerLoyaltyAccountByEmail(email).then(acc =>
          getCustomerLoyaltyTransactions(acc.customerId)
        ),
      ]);
      setAccount(accountData);
      setSummary(summaryData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to load customer loyalty data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load customer data',
        variant: 'destructive',
      });
      setAccount(null);
      setSummary(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    const colorClass = LOYALTY_TIER_COLORS[tier as keyof typeof LOYALTY_TIER_COLORS];
    return (
      <Badge className={`${colorClass} text-white`}>
        {tier}
      </Badge>
    );
  };

  const getTransactionTypeBadge = (type: LoyaltyTransaction['transactionType']) => {
    if (type.startsWith('EARN_')) {
      return <Badge variant="default" className="bg-green-600">Earn</Badge>;
    }
    if (type.startsWith('REDEEM_')) {
      return <Badge variant="default" className="bg-blue-600">Redeem</Badge>;
    }
    return <Badge variant="outline">System</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customer</CardTitle>
          <CardDescription>Enter customer email to view loyalty account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Account Overview */}
      {account && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{summary.loyalty.tierDisplay}</div>
                {getTierBadge(summary.loyalty.tier)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Points</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.loyalty.availablePoints.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Worth {summary.loyalty.pointsValue}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rentals This Year</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.loyalty.rentalsThisYear}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.loyalty.rentalsLifetime} lifetime
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Multiplier</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.benefits.pointsMultiplier}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.benefits.tierDiscount} discount
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Next Tier Progress */}
          {summary.nextTier.tier && summary.nextTier.rentalsNeeded > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Progress to {summary.nextTier.tier}</CardTitle>
                <CardDescription>
                  {summary.nextTier.rentalsNeeded} more rental{summary.nextTier.rentalsNeeded !== 1 ? 's' : ''} needed to reach the next tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{summary.nextTier.currentProgress} rentals</span>
                    <span>{summary.nextTier.targetProgress} rentals</span>
                  </div>
                  <Progress
                    value={(summary.nextTier.currentProgress / summary.nextTier.targetProgress) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Tier Benefits</CardTitle>
              <CardDescription>Benefits available for {summary.loyalty.tierDisplay}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Booking Bonus</p>
                    <p className="text-sm text-muted-foreground">
                      {summary.benefits.bookingBonus} points per booking
                    </p>
                  </div>
                </div>

                {summary.benefits.priorityCheckIn && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium">Priority Check-In</p>
                      <p className="text-sm text-muted-foreground">Skip the queue</p>
                    </div>
                  </div>
                )}

                {summary.benefits.freeUpgrade && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      🚗
                    </div>
                    <div>
                      <p className="font-medium">Free Upgrades</p>
                      <p className="text-sm text-muted-foreground">Subject to availability</p>
                    </div>
                  </div>
                )}

                {summary.benefits.guaranteedAvailability && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      🔒
                    </div>
                    <div>
                      <p className="font-medium">Guaranteed Availability</p>
                      <p className="text-sm text-muted-foreground">
                        {summary.benefits.guaranteedHours}h before pickup
                      </p>
                    </div>
                  </div>
                )}

                {summary.benefits.freeDriverDays > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      👤
                    </div>
                    <div>
                      <p className="font-medium">Free Additional Driver</p>
                      <p className="text-sm text-muted-foreground">
                        {summary.benefits.freeDriverDays} day{summary.benefits.freeDriverDays !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Recent points activity and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">No transactions found</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{getTransactionTypeBadge(transaction.transactionType)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.balanceAfter.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
