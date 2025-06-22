'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success:
          'border-green-500/50 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400 [&>svg]:text-green-600',
        warning:
          'border-yellow-500/50 text-yellow-800 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400 [&>svg]:text-yellow-600',
        info: 'border-blue-500/50 text-blue-800 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 [&>svg]:text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof alertVariants> & {
      dismissible?: boolean;
      onDismiss?: () => void;
    }
>(({ className, variant, dismissible, onDismiss, children, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {children}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

// Pre-built alert components with icons
export interface AlertWithIconProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const AlertError = React.forwardRef<HTMLDivElement, AlertWithIconProps>(
  ({ title = 'Error', description, className, ...props }, ref) => (
    <Alert ref={ref} variant="destructive" className={className} {...props}>
      <XCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
    </Alert>
  )
);
AlertError.displayName = 'AlertError';

const AlertSuccess = React.forwardRef<HTMLDivElement, AlertWithIconProps>(
  ({ title = 'Success', description, className, ...props }, ref) => (
    <Alert ref={ref} variant="success" className={className} {...props}>
      <CheckCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
    </Alert>
  )
);
AlertSuccess.displayName = 'AlertSuccess';

const AlertWarning = React.forwardRef<HTMLDivElement, AlertWithIconProps>(
  ({ title = 'Warning', description, className, ...props }, ref) => (
    <Alert ref={ref} variant="warning" className={className} {...props}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
    </Alert>
  )
);
AlertWarning.displayName = 'AlertWarning';

const AlertInfo = React.forwardRef<HTMLDivElement, AlertWithIconProps>(
  ({ title = 'Info', description, className, ...props }, ref) => (
    <Alert ref={ref} variant="info" className={className} {...props}>
      <Info className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
    </Alert>
  )
);
AlertInfo.displayName = 'AlertInfo';

export {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertError,
  AlertSuccess,
  AlertWarning,
  AlertInfo,
  alertVariants,
};
