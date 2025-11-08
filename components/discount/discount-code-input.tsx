/**
 * Multiple Discount Code Input Component
 * Allows users to enter and manage multiple discount codes
 */

'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Plus, Tag, X } from 'lucide-react';
import { useState } from 'react';

interface DiscountCodeInputProps {
  codes: string[];
  onCodesChange: (codes: string[]) => void;
  validationResults?: Record<string, { isValid: boolean; message?: string }>;
  maxCodes?: number;
}

export function DiscountCodeInput({
  codes,
  onCodesChange,
  validationResults = {},
  maxCodes = 5,
}: DiscountCodeInputProps) {
  const { t } = useLocale();
  const [inputValue, setInputValue] = useState('');

  const handleAddCode = () => {
    const trimmedCode = inputValue.trim().toUpperCase();
    
    if (!trimmedCode) return;
    
    if (codes.includes(trimmedCode)) {
      // Code already added
      return;
    }
    
    if (codes.length >= maxCodes) {
      // Max codes reached
      return;
    }

    onCodesChange([...codes, trimmedCode]);
    setInputValue('');
  };

  const handleRemoveCode = (codeToRemove: string) => {
    onCodesChange(codes.filter(code => code !== codeToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCode();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <CardTitle>Discount Codes</CardTitle>
        </div>
        <CardDescription>
          Add up to {maxCodes} discount codes. Codes will be applied sequentially.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input for new code */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter discount code"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            disabled={codes.length >= maxCodes}
            maxLength={20}
          />
          <Button
            onClick={handleAddCode}
            disabled={!inputValue.trim() || codes.length >= maxCodes}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Applied codes */}
        {codes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Applied Codes ({codes.length}/{maxCodes})</p>
            <div className="space-y-2">
              {codes.map((code, index) => {
                const validation = validationResults[code];
                const isValid = validation?.isValid ?? true;
                
                return (
                  <div
                    key={code}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      isValid
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-medium ${
                            isValid ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {code}
                          </span>
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs">
                              Applied First
                            </Badge>
                          )}
                        </div>
                        {validation?.message && (
                          <p className={`text-xs mt-1 ${
                            isValid ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {validation.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCode(code)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {codes.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No discount codes applied</p>
          </div>
        )}

        {codes.length >= maxCodes && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-900">
              Maximum number of discount codes reached
            </p>
          </div>
        )}

        {codes.length > 1 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> Discounts are applied sequentially in the order shown above.
              The first code applies to the full amount, the second to the discounted amount, and so on.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
