import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium tracking-wider uppercase text-white/60 mb-2 pl-1"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 text-white/40 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-full py-3.5 ${
              icon ? 'pl-11 pr-4' : 'px-5'
            } text-sm text-white placeholder-white/30 glass-input outline-none transition-all duration-200 ${
              error ? 'border-red-500/80 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.25)]' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 pl-3 text-xs text-red-400 font-normal animate-fadeIn">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
