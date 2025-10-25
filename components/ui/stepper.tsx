'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: Set<number>;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, completedSteps, onStepClick, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, stepIdx) => {
          const isCompleted = completedSteps ? completedSteps.has(stepIdx) : stepIdx < currentStep;
          const isCurrent = stepIdx === currentStep;
          const isClickable = !!onStepClick;

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex-1',
                stepIdx !== steps.length - 1 && 'pr-8 sm:pr-20'
              )}
            >
              {/* Connector Line */}
              {stepIdx !== steps.length - 1 && (
                <div
                  className="absolute top-4 left-0 right-0 -z-10 ml-4"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-0.5 w-full transition-colors',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => isClickable && onStepClick(stepIdx)}
                disabled={!isClickable}
                className={cn(
                  'group relative flex flex-col items-center',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-not-allowed opacity-50'
                )}
              >
                {/* Step Circle */}
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted &&
                      'border-primary bg-primary text-primary-foreground',
                    isCurrent &&
                      'border-primary bg-background text-primary',
                    !isCompleted &&
                      !isCurrent &&
                      'border-muted bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{stepIdx + 1}</span>
                  )}
                </span>

                {/* Step Label */}
                <span className="mt-2 flex flex-col items-center">
                  <span
                    className={cn(
                      'text-xs font-medium sm:text-sm',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-foreground',
                      !isCompleted && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="mt-1 hidden text-xs text-muted-foreground sm:block">
                      {step.description}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
