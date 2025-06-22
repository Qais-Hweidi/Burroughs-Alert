import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils/cn';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    error?: string;
  }
>(({ className, error, ...props }, ref) => (
  <div className="flex flex-col">
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        error &&
          'data-[state=unchecked]:bg-destructive/20 focus-visible:ring-destructive',
        className
      )}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${props.id || 'switch'}-error` : undefined}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitives.Root>
    {error && (
      <p
        id={`${props.id || 'switch'}-error`}
        className="mt-1 text-sm text-destructive"
        role="alert"
      >
        {error}
      </p>
    )}
  </div>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

// Switch with Label component for easier usage
export interface SwitchWithLabelProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label: string;
  description?: string;
  error?: string;
}

const SwitchWithLabel = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchWithLabelProps
>(({ label, description, error, className, id, ...props }, ref) => {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Switch
          ref={ref}
          id={switchId}
          className={className}
          error={error}
          {...props}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor={switchId}
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
});
SwitchWithLabel.displayName = 'SwitchWithLabel';

export { Switch, SwitchWithLabel };
