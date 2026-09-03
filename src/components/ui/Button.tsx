import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs tracking-wider uppercase',
    md: 'px-7 py-3 text-sm tracking-wide',
    lg: 'px-9 py-4 text-base tracking-wide',
  }[size];

  const variantClasses = {
    primary: 'btn-pill-primary active:scale-[0.98]',
    secondary: 'btn-pill-secondary active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-colors',
    danger:
      'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-full transition-all',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium select-none cursor-pointer transition-all disabled:opacity-45 disabled:cursor-not-allowed disabled:transform-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
