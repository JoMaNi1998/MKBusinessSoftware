import React, { ChangeEvent } from 'react';
import { TrendingDown } from 'lucide-react';
import { formatCurrency } from '@utils';

// Lokale Hilfsfunktion für Preisformatierung mit Fallback
const formatPrice = (price: number | string | null | undefined): string => {
  const formatted = formatCurrency(price);
  return formatted || '0,00 €';
};

interface QuantityScaleTier {
  label: string;
  [key: string]: any;
}

interface InvoiceTotals {
  quantityScaleDiscount?: number;
  moduleCount?: number;
  quantityScaleTier?: QuantityScaleTier;
  laborReductionTotal?: number;
  subtotalNet?: number;
  discountPercent?: number;
  discountAmount?: number;
  netTotal?: number;
  taxRate?: number;
  taxAmount?: number;
  grossTotal?: number;
}

interface InvoiceSummaryProps {
  totals: InvoiceTotals;
  onDiscountChange?: (discount: number) => void;
  onTaxRateChange?: (taxRate: number) => void;
  editable?: boolean;
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
  totals,
  onDiscountChange,
  onTaxRateChange,
  editable = false
}) => {
  return (
    <div className="w-72">
      {/* Mengenstaffel Info */}
      {totals?.quantityScaleDiscount && totals.quantityScaleDiscount > 0 && (
        <div className="bg-green-50 text-green-700 rounded p-2 mb-3 text-xs">
          <div className="flex items-center">
            <TrendingDown className="h-3 w-3 mr-1" />
            Mengenstaffel: {totals.moduleCount} Module ({totals.quantityScaleTier?.label})
          </div>
          <div className="flex justify-between mt-1">
            <span>-{totals.quantityScaleDiscount}% auf Arbeitszeit</span>
            <span>-{formatPrice(totals.laborReductionTotal)}</span>
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Zwischensumme (netto):</span>
          <span>{formatPrice(totals?.subtotalNet)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Rabatt:</span>
          <div className="flex items-center">
            {editable ? (
              <>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={totals?.discountPercent || 0}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onDiscountChange?.(parseFloat(e.target.value) || 0)}
                  className="w-12 text-right border border-gray-200 rounded px-1 py-0.5 text-xs"
                />
                <span className="text-gray-400 ml-1">%</span>
              </>
            ) : (
              <span>{totals?.discountPercent || 0}%</span>
            )}
            {totals?.discountAmount && totals.discountAmount > 0 && (
              <span className="ml-2 text-red-600">-{formatPrice(totals?.discountAmount)}</span>
            )}
          </div>
        </div>

        <div className="flex justify-between border-t pt-2">
          <span className="text-gray-600">Netto:</span>
          <span>{formatPrice(totals?.netTotal)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">MwSt:</span>
          <div className="flex items-center">
            {editable ? (
              <>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={totals?.taxRate ?? 19}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onTaxRateChange?.(parseFloat(e.target.value) || 0)}
                  className="w-12 text-right border border-gray-200 rounded px-1 py-0.5 text-xs"
                />
                <span className="text-gray-400 ml-1">%</span>
              </>
            ) : (
              <span>{totals?.taxRate ?? 19}%</span>
            )}
            <span className="ml-2">{formatPrice(totals?.taxAmount)}</span>
          </div>
        </div>

        <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
          <span>Gesamtbetrag:</span>
          <span>{formatPrice(totals?.grossTotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummary;
