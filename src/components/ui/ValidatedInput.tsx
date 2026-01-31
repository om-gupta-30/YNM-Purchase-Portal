'use client';

import React, { useState, useCallback } from 'react';

interface ValidatedInputProps {
  type?: 'text' | 'email' | 'tel' | 'number' | 'url' | 'password';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  validator?: (value: string) => { valid: boolean; message: string };
  formatter?: (value: string) => string;
  error?: string;
  helpText?: string;
}

export default function ValidatedInput({
  type = 'text',
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  maxLength,
  min,
  max,
  validator,
  formatter,
  error: externalError,
  helpText,
}: ValidatedInputProps) {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState('');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Apply formatter if provided
    if (formatter) {
      newValue = formatter(newValue);
    }
    
    onChange(newValue);
    
    // Validate on change if already touched
    if (touched && validator) {
      const result = validator(newValue);
      setInternalError(result.valid ? '' : result.message);
    }
  }, [onChange, formatter, touched, validator]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    
    // Validate on blur
    if (validator) {
      const result = validator(value);
      setInternalError(result.valid ? '' : result.message);
    }
    
    onBlur?.();
  }, [validator, value, onBlur]);

  const displayError = externalError || (touched ? internalError : '');
  const hasError = !!displayError;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-text-dark font-medium mb-1.5 text-sm">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        min={min}
        max={max}
        className={`input w-full px-4 py-2.5 ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
        required={required}
      />
      {displayError && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {displayError}
        </p>
      )}
      {helpText && !displayError && (
        <p className="mt-1 text-xs text-text-muted">{helpText}</p>
      )}
    </div>
  );
}
