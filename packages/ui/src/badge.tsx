import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-gray-100 text-gray-800 border border-gray-300',
  success:
    'bg-green-50 text-green-800 border border-green-300',
  warning:
    'bg-yellow-50 text-yellow-800 border border-yellow-300',
  error:
    'bg-red-50 text-red-800 border border-red-300',
  info: 'bg-blue-50 text-blue-800 border border-blue-300',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => (
    <span
      ref={ref}
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5
        text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
);

Badge.displayName = 'Badge';
