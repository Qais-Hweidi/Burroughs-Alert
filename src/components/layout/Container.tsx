import { cn } from '@/lib/utils/formatting';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
}

export default function Container({
  children,
  className,
  size = 'xl',
  padding = true,
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'mx-auto',
        sizeClasses[size],
        padding && 'container-padding',
        className
      )}
    >
      {children}
    </div>
  );
}
