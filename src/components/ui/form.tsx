import * as React from "react"
import { cn } from "@/lib/utils"

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => {
    return (
      <form
        className={cn("space-y-6", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Form.displayName = "Form"

interface FormFieldProps {
  children: React.ReactNode
  className?: string
}

const FormField = ({ children, className }: FormFieldProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  )
}

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: boolean
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          "text-sm",
          error ? "text-destructive" : "text-muted-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
FormMessage.displayName = "FormMessage"

export { Form, FormField, FormMessage }