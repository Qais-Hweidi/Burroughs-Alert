import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    error?: string;
    indeterminate?: boolean;
  }
>(({ className, error, indeterminate, ...props }, ref) => (
  <div className="flex flex-col">
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        indeterminate &&
          'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
        error && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${props.id || 'checkbox'}-error` : undefined}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center text-current')}
      >
        {indeterminate ? (
          <div className="h-2 w-2 bg-current rounded-sm" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
    {error && (
      <p
        id={`${props.id || 'checkbox'}-error`}
        className="mt-1 text-sm text-destructive"
        role="alert"
      >
        {error}
      </p>
    )}
  </div>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// Checkbox with Label component for easier usage
export interface CheckboxWithLabelProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label: string;
  description?: string;
  error?: string;
  indeterminate?: boolean;
}

const CheckboxWithLabel = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxWithLabelProps
>(
  (
    { label, description, error, indeterminate, className, id, ...props },
    ref
  ) => {
    const checkboxId =
      id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            ref={ref}
            id={checkboxId}
            className={className}
            error={error}
            indeterminate={indeterminate}
            {...props}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {label}
            </label>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
);
CheckboxWithLabel.displayName = 'CheckboxWithLabel';

export { Checkbox, CheckboxWithLabel };
