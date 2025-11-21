import React, { InputHTMLAttributes } from 'react';

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  error, 
  helperText,
  leftIcon,
  rightIcon, 
  className = '', 
  variant = 'outlined',
  size = 'md',
  fullWidth = true,
  ...props 
}) => {
  const baseInputClasses = 'rounded-lg border transition-all duration-base focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-base', // Changed from text-sm to text-base to prevent mobile zoom
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-5 text-lg',
  };

  const variantClasses = {
    outlined: 'border-gray-300 bg-white hover:border-gray-400 focus:border-primary-500 focus:ring-primary-500',
    filled: 'border-gray-200 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-primary-500 focus:ring-primary-500'
  };
  
  const errorClasses = error 
    ? 'border-danger-500 bg-danger-50 focus:ring-danger-500 focus:border-danger-500' 
    : '';
  
  const widthClasses = fullWidth ? 'w-full' : '';
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            ${baseInputClasses} 
            ${sizeClasses[size]} 
            ${variantClasses[variant]} 
            ${errorClasses} 
            ${leftIcon ? 'pl-10' : ''} 
            ${rightIcon ? 'pr-10' : ''} 
            ${widthClasses} 
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-danger-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default InputField;
