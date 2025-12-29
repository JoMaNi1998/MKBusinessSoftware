import React, { createContext, useContext, useCallback } from 'react';
import { InvoiceService } from '../services/firebaseService';
import { CounterService } from '../services/CounterService';
import { useAuth } from './AuthContext';
import { useCalculation } from './CalculationContext';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';
import type {
  InvoiceContextValue,
  ExtendedInvoice,
  InvoiceStatistics,
  VersionHistoryEntry,
  InvoiceStatusConfig,
  InvoiceTypeConfig
} from '../types/contexts/invoice.types';
import type { Offer } from '../types';
import { InvoiceStatus, InvoiceType } from '../types/enums';

const InvoiceContext = createContext<InvoiceContextValue | undefined>(undefined);

export const useInvoice = (): InvoiceContextValue => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
};

// Export enums for backward compatibility
export const INVOICE_STATUS = InvoiceStatus;
export const INVOICE_TYPE = InvoiceType;

// Status-Konfiguration
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, InvoiceStatusConfig> = {
  [InvoiceStatus.DRAFT]: {
    label: 'Entwurf',
    color: 'gray',
    description: 'Rechnung in Bearbeitung'
  },
  [InvoiceStatus.SENT]: {
    label: 'Versendet',
    color: 'blue',
    description: 'Rechnung versendet, Zahlung ausstehend'
  },
  [InvoiceStatus.PAID]: {
    label: 'Bezahlt',
    color: 'green',
    description: 'Rechnung vollständig bezahlt'
  },
  [InvoiceStatus.OVERDUE]: {
    label: 'Überfällig',
    color: 'red',
    description: 'Zahlung überfällig'
  },
  [InvoiceStatus.CANCELLED]: {
    label: 'Storniert',
    color: 'gray',
    description: 'Rechnung storniert'
  }
};

// Rechnungstyp-Konfiguration
export const INVOICE_TYPE_LABELS: Record<InvoiceType, InvoiceTypeConfig> = {
  [InvoiceType.FULL]: {
    label: 'Vollrechnung',
    color: 'blue',
    description: '100% Rechnungsbetrag'
  },
  [InvoiceType.DEPOSIT]: {
    label: 'Anzahlungsrechnung',
    color: 'orange',
    description: 'Teilbetrag als Anzahlung'
  },
  [InvoiceType.FINAL]: {
    label: 'Schlussrechnung',
    color: 'green',
    description: 'Restbetrag nach Anzahlung'
  }
};

interface InvoiceProviderProps {
  children: React.ReactNode;
}

export const InvoiceProvider: React.FC<InvoiceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { calculateOfferTotals } = useCalculation();

  // Firebase Real-time Listener
  const {
    data: invoicesData,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener(InvoiceService.subscribeToInvoices);

  // Type assertion: Invoice → ExtendedInvoice
  const invoices = invoicesData as ExtendedInvoice[];

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  // Helper: Währungsformatierung (TODO: für zukünftige Features)
  const _formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  // Helper: Datum formatieren (TODO: für zukünftige Features)
  const _formatDateSimple = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  // Prüfen ob Angebot bereits Anzahlungsrechnung hat
  const hasDepositInvoice = useCallback((offerId: string): boolean => {
    return invoices.some(
      inv => inv.offerID === offerId && inv.type === InvoiceType.DEPOSIT
    );
  }, [invoices]);

  // Anzahlungsrechnung für Angebot holen
  const getDepositInvoice = useCallback((offerId: string): ExtendedInvoice | undefined => {
    return invoices.find(
      inv => inv.offerID === offerId && inv.type === InvoiceType.DEPOSIT
    );
  }, [invoices]);

  // Rechnung erstellen (manuell)
  const createInvoice = useCallback(async (
    invoiceData: Partial<ExtendedInvoice>
  ): Promise<{ success: boolean; invoiceId?: string; invoiceNumber?: string; error?: string }> => {
    try {
      // Rechnungsnummer atomar generieren (race-condition safe)
      const invoiceNumber = await CounterService.getNextNumber('invoices', 'RE');

      const newInvoice: Partial<ExtendedInvoice> = {
        ...invoiceData,
        id: invoiceNumber,  // Verwende invoiceNumber als Document-ID
        invoiceNumber,
        status: invoiceData.status || InvoiceStatus.DRAFT,
        type: invoiceData.type || InvoiceType.FULL,
        createdBy: user?.uid || 'system',
        version: 1,
        history: [
          {
            version: 1,
            createdAt: new Date().toISOString(),
            createdBy: user?.uid || 'system',
            changes: 'Rechnung erstellt'
          }
        ]
      };

      const result = await InvoiceService.addInvoice(newInvoice as unknown as ExtendedInvoice);
      return { success: true, invoiceId: result.id as string, invoiceNumber };
    } catch (err) {
      console.error('Error creating invoice:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [user]);

  // Rechnung aus Angebot erstellen (Anzahlung oder Schluss)
  const createInvoiceFromOffer = useCallback(async (
    offer: Offer,
    forceType?: InvoiceType
  ): Promise<{ success: boolean; invoiceId?: string; error?: string }> => {
    try {
      // Prüfen ob bereits Anzahlungsrechnung existiert
      const existingDepositInvoice = getDepositInvoice(offer.id);
      const hasDeposit = !!existingDepositInvoice;

      // Typ automatisch bestimmen oder forcieren
      let invoiceType: InvoiceType;
      if (forceType) {
        invoiceType = forceType;
      } else {
        invoiceType = hasDeposit ? InvoiceType.FINAL : InvoiceType.DEPOSIT;
      }

      // Rechnungsnummer atomar generieren (race-condition safe)
      const invoiceNumber = await CounterService.getNextNumber('invoices', 'RE');

      // Basis-Rechnungsdaten
      const invoiceDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 14 Tage

      const baseInvoice: Partial<ExtendedInvoice> = {
        id: invoiceNumber,  // Verwende invoiceNumber als Document-ID
        invoiceNumber,
        customerID: offer.customerID,
        projectID: offer.projectID,
        offerID: offer.id,
        offerNumber: offer.offerNumber,
        type: invoiceType,
        status: InvoiceStatus.DRAFT,
        invoiceDate,
        dueDate,
        items: offer.items,
        conditions: {
          invoiceDate,
          dueDate,
          paymentTerms: '14 Tage netto',
          notes: offer.notes || ''
        },
        notes: offer.notes || '',
        createdBy: user?.uid || 'system',
        version: 1,
        history: [
          {
            version: 1,
            createdAt: new Date().toISOString(),
            createdBy: user?.uid || 'system',
            changes: `Rechnung aus Angebot ${offer.offerNumber} erstellt (${INVOICE_TYPE_LABELS[invoiceType]?.label})`
          }
        ]
      };

      // Totals berechnen basierend auf Typ
      let offerTotals;
      if (invoiceType === InvoiceType.DEPOSIT) {
        // Anzahlungsrechnung: Prozentsatz vom Angebot
        const depositPercent = offer.depositPercent || 30;
        const originalTotals = calculateOfferTotals(
          offer.items,
          offer.discount || 0,
          offer.taxRate ?? null
        );

        const depositAmount = originalTotals.grossTotal * (depositPercent / 100);

        baseInvoice.depositPercent = depositPercent;
        baseInvoice.depositAmount = depositAmount;
        baseInvoice.originalAmount = originalTotals.grossTotal;

        // Proportionale Aufteilung - Konvertierung zu OfferTotals Format
        const factor = depositPercent / 100;
        offerTotals = {
          subtotalNet: originalTotals.subtotalNet * factor,
          netTotal: originalTotals.netTotal * factor,
          discountPercent: originalTotals.discountPercent,
          discountAmount: originalTotals.discountAmount * factor,
          vatRate: originalTotals.taxRate,
          vatAmount: originalTotals.taxAmount * factor,
          grossTotal: depositAmount
        };
      } else if (invoiceType === InvoiceType.FINAL && existingDepositInvoice) {
        // Schlussrechnung: Restbetrag nach Anzahlung
        const originalTotals = calculateOfferTotals(
          offer.items,
          offer.discount || 0,
          offer.taxRate ?? null
        );

        const depositAmount = existingDepositInvoice.depositAmount || 0;
        const remainingGross = originalTotals.grossTotal - depositAmount;

        baseInvoice.depositInvoiceID = existingDepositInvoice.id;
        baseInvoice.depositAmount = depositAmount;
        baseInvoice.originalAmount = originalTotals.grossTotal;

        // Restbetrag berechnen - Konvertierung zu OfferTotals Format
        const remainingFactor = remainingGross / originalTotals.grossTotal;
        offerTotals = {
          subtotalNet: originalTotals.subtotalNet * remainingFactor,
          netTotal: originalTotals.netTotal * remainingFactor,
          discountPercent: originalTotals.discountPercent,
          discountAmount: originalTotals.discountAmount * remainingFactor,
          netAfterDiscount: originalTotals.netTotal * remainingFactor,
          vatRate: originalTotals.taxRate,
          vatAmount: originalTotals.taxAmount * remainingFactor,
          grossTotal: remainingGross
        };
      } else {
        // Vollrechnung: Volle Beträge - Konvertierung zu OfferTotals Format
        const result = calculateOfferTotals(
          offer.items,
          offer.discount || 0,
          offer.taxRate ?? null
        );
        offerTotals = {
          subtotalNet: result.subtotalNet,
          netTotal: result.netTotal,
          discountPercent: result.discountPercent,
          discountAmount: result.discountAmount,
          netAfterDiscount: result.netTotal,
          vatRate: result.taxRate,
          vatAmount: result.taxAmount,
          grossTotal: result.grossTotal
        };
      }

      baseInvoice.totals = offerTotals;

      const result = await InvoiceService.addInvoice(baseInvoice as unknown as ExtendedInvoice);
      return { success: true, invoiceId: result.id as string };
    } catch (err) {
      console.error('Error creating invoice from offer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [user, getDepositInvoice, calculateOfferTotals]);

  // Rechnung aktualisieren
  const updateInvoice = useCallback(async (
    invoiceId: string,
    invoiceData: Partial<ExtendedInvoice>,
    changeDescription?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) {
      return { success: false, error: 'Rechnung nicht gefunden' };
    }

    const newVersion = (invoice.version || 1) + 1;
    const historyEntry: VersionHistoryEntry = {
      version: newVersion,
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || 'system',
      changes: changeDescription || 'Rechnung aktualisiert'
    };

    const updatedInvoice: Partial<ExtendedInvoice> = {
      ...invoiceData,
      version: newVersion,
      history: [...(invoice.history || []), historyEntry]
    };

    return crud.execute(() => InvoiceService.updateInvoice(invoiceId, updatedInvoice));
  }, [crud, invoices, user]);

  // Rechnung löschen
  const deleteInvoice = useCallback(async (invoiceId: string): Promise<{ success: boolean; error?: string }> => {
    return crud.execute(() => InvoiceService.deleteInvoice(invoiceId));
  }, [crud]);

  // Rechnungsstatus aktualisieren
  const updateInvoiceStatus = useCallback(async (
    invoiceId: string,
    newStatus: InvoiceStatus
  ): Promise<{ success: boolean; error?: string }> => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) {
      return { success: false, error: 'Rechnung nicht gefunden' };
    }

    return updateInvoice(invoiceId, {
      status: newStatus,
      paidAt: newStatus === InvoiceStatus.PAID ? new Date().toISOString().split('T')[0] : invoice.paidAt,
      history: [
        ...(invoice.history || []),
        {
          version: invoice.version || 1,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || 'system',
          changes: `Status geändert: ${INVOICE_STATUS_LABELS[newStatus]?.label}`
        }
      ]
    });
  }, [invoices, user, updateInvoice]);

  // Rechnungen nach Kunde
  const getInvoicesByCustomer = useCallback((customerId: string): ExtendedInvoice[] => {
    return invoices.filter(i => i.customerID === customerId);
  }, [invoices]);

  // Rechnungen nach Angebot
  const getInvoicesByOffer = useCallback((offerId: string): ExtendedInvoice[] => {
    return invoices.filter(i => i.offerID === offerId);
  }, [invoices]);

  // Rechnungen nach Status
  const getInvoicesByStatus = useCallback((status: InvoiceStatus): ExtendedInvoice[] => {
    return invoices.filter(i => i.status === status);
  }, [invoices]);

  // Rechnung nach ID
  const getInvoiceById = useCallback((invoiceId: string): ExtendedInvoice | undefined => {
    return invoices.find(i => i.id === invoiceId);
  }, [invoices]);

  // Überfällige Rechnungen prüfen und Status aktualisieren
  const checkOverdueInvoices = useCallback(async (): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];

    for (const invoice of invoices) {
      if (
        invoice.status === InvoiceStatus.SENT &&
        invoice.dueDate &&
        invoice.dueDate < today
      ) {
        await updateInvoiceStatus(invoice.id, InvoiceStatus.OVERDUE);
      }
    }
  }, [invoices, updateInvoiceStatus]);

  // Statistiken
  const getStatistics = useCallback((): InvoiceStatistics => {
    const stats: InvoiceStatistics = {
      total: invoices.length,
      byStatus: {
        [InvoiceStatus.DRAFT]: 0,
        [InvoiceStatus.SENT]: 0,
        [InvoiceStatus.PAID]: 0,
        [InvoiceStatus.OVERDUE]: 0,
        [InvoiceStatus.CANCELLED]: 0
      },
      totalValue: 0,
      paidValue: 0,
      openValue: 0
    };

    Object.values(InvoiceStatus).forEach(status => {
      stats.byStatus[status] = invoices.filter(i => i.status === status).length;
    });

    invoices.forEach(invoice => {
      const value = invoice.totals?.grossTotal || 0;
      stats.totalValue += value;
      if (invoice.status === InvoiceStatus.PAID) {
        stats.paidValue += value;
      } else if (invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE) {
        stats.openValue += value;
      }
    });

    return stats;
  }, [invoices]);

  const value: InvoiceContextValue = {
    invoices,
    loading,
    error,
    createInvoice,
    createInvoiceFromOffer,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    getInvoicesByCustomer,
    getInvoicesByOffer,
    getInvoicesByStatus,
    getInvoiceById,
    hasDepositInvoice,
    getDepositInvoice,
    checkOverdueInvoices,
    getStatistics,
    INVOICE_STATUS_LABELS,
    INVOICE_TYPE_LABELS
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};
