'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/api/hooks';
import { formatDate, parseHalResource } from '@/lib/utils';
import type { Discount } from '@/types';
import { Download, Percent, Plus, Search, Tag } from 'lucide-react';
import { useState } from 'react';

export default function DiscountsPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error } = useCollection<Discount>('discounts', {
    page,
    size: 20,
    sort: 'validFrom,desc',
  });

  const discounts = data ? parseHalResource<Discount>(data, 'discounts') : [];
  const totalPages = data?.page?.totalPages || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success/20 text-success';
      case 'INACTIVE':
        return 'bg-muted text-muted-foreground';
      case 'EXPIRED':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDiscountValue = (discount: Discount) => {
    if (discount.type === 'PERCENTAGE') {
      return `${discount.value ?? 0}%`;
    }
    return `$${(discount.value ?? 0).toFixed(2)}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discounts</h1>
          <p className="text-muted-foreground">
            Manage promotional codes and discounts
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Discount
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Discounts Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading discounts...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Error loading discounts: {error.message}</p>
        </div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No discounts found</p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Discount
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {discounts.map((discount) => (
              <Card key={discount.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg font-mono">
                          {discount.code || 'N/A'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {discount.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                        discount.status || 'INACTIVE'
                      )}`}
                    >
                      {discount.status || 'INACTIVE'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {discount.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {discount.description}
                    </p>
                  )}

                  <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-center">
                      <Percent className="h-6 w-6 text-primary mx-auto mb-1" />
                      <p className="text-3xl font-bold text-primary">
                        {formatDiscountValue(discount)}
                      </p>
                      <p className="text-xs text-muted-foreground">Discount Value</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valid From:</span>
                      <p className="font-medium">{discount.validFrom ? formatDate(discount.validFrom) : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valid To:</span>
                      <p className="font-medium">{discount.validTo ? formatDate(discount.validTo) : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Min. Amount:</span>
                      <p className="font-medium">${discount.minBookingAmount ?? 0}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Usage:</span>
                      <p className="font-medium">
                        {discount.usesCount ?? 0} / {discount.maxUses ?? 0}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground">Scope:</span>
                    <p className="text-sm font-medium">{discount.applicableScope || 'N/A'}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
