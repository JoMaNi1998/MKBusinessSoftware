/**
 * PV-Konfigurator Form-Komponenten
 *
 * Wiederverwendbare UI-Komponenten für den Wizard
 */

import React from 'react';

/**
 * SectionCard - Container mit optionalem Icon und Titel
 */
export const SectionCard = ({ titleIcon: Icon, title, children, className = '' }) => (
  <div className={`bg-white p-4 rounded-lg border border-gray-200 ${className}`}>
    {title && (
      <div className="flex items-center space-x-2 mb-3">
        {Icon ? <Icon className="h-4 w-4 text-gray-600" /> : null}
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

/**
 * LabeledSelect - Dropdown mit Label und Validierung
 */
export const LabeledSelect = ({
  label,
  value,
  onChange,
  options,
  required = false,
  hasError = false,
  placeholder = 'Auswählen...',
  disabled = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
        hasError ? 'border-red-300' : 'border-gray-300'
      } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    {hasError && <p className="text-red-600 text-xs mt-1">Feld ist erforderlich</p>}
  </div>
);

/**
 * LabeledNumber - Number-Input mit Label
 */
export const LabeledNumber = ({
  label,
  value,
  onChange,
  min = 0,
  max,
  hasError = false,
  disabled = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full border rounded px-3 py-2 ${
        hasError ? 'border-red-300' : 'border-gray-300'
      } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    />
    {hasError && <p className="text-red-600 text-xs mt-1">Ungültiger Wert</p>}
  </div>
);

/**
 * LabeledInput - Text-Input mit Label
 */
export const LabeledInput = ({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  hasError = false,
  disabled = false,
  type = 'text',
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
        hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
      } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    />
    {hasError && <p className="text-red-600 text-xs mt-1">Feld ist erforderlich</p>}
  </div>
);

/**
 * ValidationErrorBox - Box für Validierungsfehler
 */
export const ValidationErrorBox = ({ errors }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <p className="text-red-800 font-medium text-sm">Bitte korrigieren Sie folgende Fehler:</p>
      <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
        {errors.map((err, i) => (
          <li key={i}>{err}</li>
        ))}
      </ul>
    </div>
  );
};

/**
 * InfoBox - Informationsbox mit farbigem Hintergrund
 */
export const InfoBox = ({ children, variant = 'blue' }) => {
  const variants = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800',
  };

  return (
    <div className={`border rounded-lg p-4 ${variants[variant]}`}>
      {children}
    </div>
  );
};

/**
 * GridSelect - Grid von auswählbaren Karten
 */
export const GridSelect = ({ options, value, onChange, columns = 3, hasError = false }) => {
  return (
    <div>
      {hasError && <p className="text-red-600 text-xs mb-3">Bitte wählen Sie eine Option</p>}
      <div className={`grid grid-cols-${columns} gap-3`}>
        {options.map((option) => (
          <div
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`p-3 rounded-lg border cursor-pointer text-center transition-all ${
              value === option.value
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            {option.emoji && <div className="text-2xl mb-1">{option.emoji}</div>}
            <div className="font-medium text-gray-900 text-sm">{option.label || option.value}</div>
            {option.desc && <div className="text-xs text-gray-600">{option.desc}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * QuantitySelector - Selector mit +/- Buttons
 */
export const QuantitySelector = ({ value, onChange, min = 0, max = 999 }) => {
  const handleDecrease = () => {
    const newValue = Math.max(min, (value || 0) - 1);
    onChange(newValue);
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, (value || 0) + 1);
    onChange(newValue);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={handleDecrease}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded border border-gray-300"
      >
        -
      </button>
      <span className="text-sm font-medium w-8 text-center">{value || 0}</span>
      <button
        type="button"
        onClick={handleIncrease}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded border border-gray-300"
      >
        +
      </button>
    </div>
  );
};
