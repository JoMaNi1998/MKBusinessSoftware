import React from 'react';
import { CheckboxFieldProps } from '../types';

const CheckboxField = React.memo(function CheckboxField({
  field,
  label,
  checked,
  onChange,
  small = false,
}: CheckboxFieldProps) {
  return (
    <label className={`flex items-start ${small ? 'mb-1' : 'mb-2'}`}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(field, e.target.checked)}
        className={`${small ? 'mr-2' : 'mt-1 mr-3'} flex-shrink-0`}
      />
      <span className={small ? 'text-xs' : 'text-sm'}>{label}</span>
    </label>
  );
});

export default CheckboxField;
