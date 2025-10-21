import React, { InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  error, 
  icon, 
  className = '', 
  variant = 'default',
  ...props 
}) => {
  const baseInputClasses = 'w-full px-4 py-3 text-sm font-montserrat rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';
  
  const variantClasses = {
    default: 'border-gray-300 bg-white hover:border-gray-400 focus:bg-white',
    filled: 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
  };
  
  const errorClasses = error ? 'border-red-500 bg-red-50 focus:ring-red-500' : '';
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2 font-lato">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}
        <input
          className={`${baseInputClasses} ${variantClasses[variant]} ${errorClasses} ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default InputField;
