import React from 'react';

const InputField = React.memo(function InputField({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  className = '',
  align = 'left',
}) {
  const base = 'border-b border-gray-400 bg-transparent';
  const alignCls = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${base} ${alignCls} ${className}`}
    />
  );
});

export default InputField;
