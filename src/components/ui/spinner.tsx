import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const spinnerVariants = cva(
  "animate-spin rounded-full border-solid border-current",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-2",
        default: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-3",
        xl: "h-12 w-12 border-4",
      },
      variant: {
        default: "border-t-transparent",
        primary: "border-primary border-t-transparent",
        secondary: "border-secondary border-t-transparent",
        muted: "border-muted-foreground border-t-transparent",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, label = "Loading", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(spinnerVariants({ size, variant, className }))}
      role="status"
      aria-label={label}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  )
)
Spinner.displayName = "Spinner"

// Loading component with optional text
export interface LoadingProps extends SpinnerProps {
  text?: string
  center?: boolean
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ text, center = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2",
        center && "justify-center",
        className
      )}
    >
      <Spinner {...props} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
)
Loading.displayName = "Loading"

// Full page loading overlay
export interface LoadingOverlayProps extends LoadingProps {
  show?: boolean
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ show = true, text = "Loading...", className, ...props }, ref) => {
    if (!show) return null

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
          className
        )}
      >
        <Loading text={text} center {...props} />
      </div>
    )
  }
)
LoadingOverlay.displayName = "LoadingOverlay"

export { Spinner, Loading, LoadingOverlay, spinnerVariants }