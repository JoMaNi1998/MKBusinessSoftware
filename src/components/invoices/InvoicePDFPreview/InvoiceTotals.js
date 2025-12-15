import React from 'react';
import { formatPrice } from '../shared/formatPrice';
import { INVOICE_TYPE } from '../../../context/InvoiceContext';

const InvoiceTotals = ({ invoice }) => {
  const { totals, invoiceType, offerDepositPercent, depositAmount } = invoice;

  return (
    <div className="flex justify-end mb-8">
      <div className="w-72">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Netto:</span>
            <span>{formatPrice(totals?.netTotal)}</span>
          </div>
          {(totals?.taxRate > 0) ? (
            <div className="flex justify-between">
              <span className="text-gray-600">MwSt ({totals?.taxRate}%):</span>
              <span>{formatPrice(totals?.taxAmount)}</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-600">0% MwSt. nach §12 UStG</span>
              <span>{formatPrice(0)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Brutto-Gesamtsumme:</span>
            <span>{formatPrice(totals?.grossTotal)}</span>
          </div>

          {/* Bei Anzahlungsrechnung: Anzahlungsbetrag zeigen */}
          {invoiceType === INVOICE_TYPE.DEPOSIT && totals?.finalAmount && (
            <>
              <div className="border-t my-2"></div>
              <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                <span>Anzahlung ({totals?.invoicePercent || offerDepositPercent || 50}%):</span>
                <span>{formatPrice(totals?.finalAmount)}</span>
              </div>
            </>
          )}

          {/* Bei Schlussrechnung: Gesamtübersicht zeigen */}
          {invoiceType === INVOICE_TYPE.FINAL && (
            <>
              <div className="border-t my-2"></div>
              <div className="flex justify-between text-green-600">
                <span>Abzgl. Anzahlung ({offerDepositPercent || 50}%):</span>
                <span>- {formatPrice(totals?.depositAmount || depositAmount || (totals?.grossTotal * (offerDepositPercent || 50) / 100))}</span>
              </div>
              <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                <span>Zu zahlender Restbetrag:</span>
                <span>{formatPrice(totals?.finalAmount || totals?.grossTotal)}</span>
              </div>
            </>
          )}

          {/* Bei normaler Rechnung (ohne Angebot): Einfacher Rechnungsbetrag */}
          {(!invoiceType || invoiceType === 'full') && (
            <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
              <span>Rechnungsbetrag:</span>
              <span>{formatPrice(totals?.grossTotal)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotals;
