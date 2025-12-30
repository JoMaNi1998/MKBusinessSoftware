import React from 'react';
import { Check } from 'lucide-react';

interface MobileSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * MobileSection - Container fuer Formular-Abschnitte
 */
export const MobileSection: React.FC<MobileSectionProps> = ({ title, children }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
      </div>
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  );
};

interface MobileInputFieldProps {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date';
  placeholder?: string;
  className?: string;
}

/**
 * MobileInputField - Touch-optimiertes Input-Feld
 */
export const MobileInputField: React.FC<MobileInputFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 touch-manipulation"
        inputMode={type === 'number' ? 'decimal' : undefined}
      />
    </div>
  );
};

interface MobileCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  small?: boolean;
}

/**
 * MobileCheckbox - Touch-optimiertes Checkbox
 */
export const MobileCheckbox: React.FC<MobileCheckboxProps> = ({
  label,
  checked,
  onChange,
  small = false
}) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-3 text-left touch-manipulation ${small ? 'py-1' : 'py-2'}`}
    >
      <div
        className={`flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
          small ? 'w-5 h-5' : 'w-6 h-6'
        } ${
          checked
            ? 'bg-primary-600 border-primary-600'
            : 'bg-white border-gray-300'
        }`}
      >
        {checked && <Check className={`text-white ${small ? 'h-3 w-3' : 'h-4 w-4'}`} />}
      </div>
      <span className={`${small ? 'text-xs' : 'text-sm'} text-gray-700 leading-tight`}>
        {label}
      </span>
    </button>
  );
};

interface MobileCheckboxGroupProps {
  items: Array<{
    field: string;
    label: string;
  }>;
  vdeData: Record<string, unknown>;
  onChange: (field: string, value: boolean) => void;
}

/**
 * MobileCheckboxGroup - Gruppe von Checkboxen
 */
export const MobileCheckboxGroup: React.FC<MobileCheckboxGroupProps> = ({
  items,
  vdeData,
  onChange
}) => {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <MobileCheckbox
          key={item.field}
          label={item.label}
          checked={!!vdeData[item.field]}
          onChange={(val) => onChange(item.field, val)}
        />
      ))}
    </div>
  );
};

export default {
  MobileSection,
  MobileInputField,
  MobileCheckbox,
  MobileCheckboxGroup
};
