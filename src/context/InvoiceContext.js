import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { InvoiceService } from '../services/firebaseService';
import { useCalculation } from './CalculationContext';
import { useAuth } from './AuthContext';

const InvoiceContext = createContext();

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
};

// Status-Optionen für Rechnungen
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

export const INVOICE_STATUS_LABELS = {
  draft: { label: 'Entwurf', color: 'gray', icon: 'Edit' },
  sent: { label: 'Gesendet', color: 'blue', icon: 'Send' },
  paid: { label: 'Bezahlt', color: 'green', icon: 'CheckCircle' },
  overdue: { label: 'Überfällig', color: 'red', icon: 'AlertCircle' },
  cancelled: { label: 'Storniert', color: 'orange', icon: 'XCircle' }
};

// Rechnungstypen
export const INVOICE_TYPE = {
  FULL: 'full',           // Vollständige Rechnung (ohne Angebot)
  DEPOSIT: 'deposit',     // Anzahlungsrechnung
  FINAL: 'final'          // Schlussrechnung
};

export const INVOICE_TYPE_LABELS = {
  full: { label: 'Rechnung', color: 'gray' },
  deposit: { label: 'Anzahlungsrechnung', color: 'blue' },
  final: { label: 'Schlussrechnung', color: 'green' }
};

export const InvoiceProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { calculateOfferTotals, settings: calcSettings } = useCalculation();
  const { user } = useAuth();

  // Firebase Real-time Listener
  useEffect(() => {
    let unsubscribe;

    const setupListener = async () => {
      try {
        setLoading(true);
        unsubscribe = InvoiceService.subscribeToInvoices((invoicesData) => {
          setInvoices(invoicesData || []);
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up invoices listener:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Neue Rechnung erstellen
  const createInvoice = useCallback(async (invoiceData) => {
    try {
      setLoading(true);

      // Rechnungsnummer generieren
      const invoiceNumber = await InvoiceService.getNextInvoiceNumber();

      // Summen berechnen - oder vorgegebene Totals verwenden (für Anzahlung/Schlussrechnung)
      let totals;
      if (invoiceData.totals && invoiceData.skipTotalsCalculation) {
        // Bei Anzahlung/Schlussrechnung: vorgegebene Totals verwenden
        totals = invoiceData.totals;
      } else {
        // Normale Berechnung
        totals = calculateOfferTotals(invoiceData.items || [], invoiceData.discountPercent || 0);
      }

      // Fälligkeitsdatum berechnen (Standard: 14 Tage)
      const dueDate = invoiceData.dueDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        return date.toISOString().split('T')[0];
      })();

      // Eindeutige ID
      const invoiceId = `invoice-${invoiceNumber}-${Date.now()}`;

      const newInvoice = {
        ...invoiceData,
        id: invoiceId,
        invoiceNumber,
        status: invoiceData.status || INVOICE_STATUS.DRAFT,
        totals,
        invoiceDate: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate,
        paymentTerms: invoiceData.paymentTerms || calcSettings.offerDefaults?.paymentTerms || '14 Tage netto',
        version: 1,
        history: [{
          version: 1,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || 'system',
          changes: 'Erstellt'
        }],
        createdBy: user?.uid || 'system'
      };

      // Temporäres Flag entfernen
      delete newInvoice.skipTotalsCalculation;

      const result = await InvoiceService.addInvoice(newInvoice);
      return { success: true, invoiceId: result.id, invoiceNumber };
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [calculateOfferTotals, calcSettings, user]);

  // Prüfen ob für ein Angebot bereits eine Anzahlungsrechnung existiert
  const hasDepositInvoice = useCallback((offerId) => {
    return invoices.some(i =>
      i.offerID === offerId &&
      i.invoiceType === INVOICE_TYPE.DEPOSIT &&
      i.status !== INVOICE_STATUS.CANCELLED
    );
  }, [invoices]);

  // Anzahlungsrechnung für ein Angebot holen
  const getDepositInvoice = useCallback((offerId) => {
    return invoices.find(i =>
      i.offerID === offerId &&
      i.invoiceType === INVOICE_TYPE.DEPOSIT &&
      i.status !== INVOICE_STATUS.CANCELLED
    );
  }, [invoices]);

  // Rechnung aus Angebot erstellen (automatisch Anzahlung oder Schlussrechnung)
  const createInvoiceFromOffer = useCallback(async (offer, forceType = null) => {
    try {
      // Prüfen ob bereits Anzahlung existiert
      const depositExists = hasDepositInvoice(offer.id);
      const depositInvoice = getDepositInvoice(offer.id);

      // Rechnungstyp bestimmen
      const invoiceType = forceType || (depositExists ? INVOICE_TYPE.FINAL : INVOICE_TYPE.DEPOSIT);

      // Anzahlungsprozent aus Angebot
      const depositPercent = offer.depositPercent || 50;

      // Gesamtbetrag und MwSt aus Angebot
      const offerGrossTotal = offer.totals?.grossTotal || 0;
      const offerNetTotal = offer.totals?.netTotal || 0;
      const taxRate = offer.totals?.taxRate || 0;

      let invoiceGross;
      let invoiceNet;
      let invoicePercent;
      let notes;

      if (invoiceType === INVOICE_TYPE.DEPOSIT) {
        // Anzahlungsrechnung: X% des Gesamtbetrags
        invoicePercent = depositPercent;
        invoiceGross = offerGrossTotal * (depositPercent / 100);
        invoiceNet = offerNetTotal * (depositPercent / 100);
        notes = `Anzahlungsrechnung (${depositPercent}%) zu Angebot ${offer.offerNumber}`;
      } else {
        // Schlussrechnung: Restbetrag (100% - Anzahlung)
        invoicePercent = 100 - depositPercent;
        invoiceGross = offerGrossTotal * (invoicePercent / 100);
        invoiceNet = offerNetTotal * (invoicePercent / 100);
        notes = `Schlussrechnung (${invoicePercent}%) zu Angebot ${offer.offerNumber}`;
      }

      // MwSt-Betrag berechnen
      const taxAmount = invoiceGross - invoiceNet;

      // Für Anzahlung/Schlussrechnung: Eine Sammelposition erstellen
      const invoiceItems = [{
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: 1,
        type: 'summary',
        shortText: invoiceType === INVOICE_TYPE.DEPOSIT
          ? `Anzahlung ${depositPercent}% gemäß Angebot ${offer.offerNumber}`
          : `Schlussrechnung ${invoicePercent}% gemäß Angebot ${offer.offerNumber}`,
        longText: invoiceType === INVOICE_TYPE.FINAL && depositInvoice
          ? `Gesamtbetrag: ${formatCurrency(offerGrossTotal)} - Anzahlung (${depositPercent}%): ${formatCurrency(depositInvoice.totals?.grossTotal || offerGrossTotal * depositPercent / 100)} = Restbetrag`
          : `Bezugnehmend auf Angebot ${offer.offerNumber} vom ${formatDateSimple(offer.createdAt)}`,
        quantity: 1,
        unit: 'psch',
        unitPriceNet: invoiceNet,
        totalNet: invoiceNet,
        discount: 0
      }];

      // Totals für die Rechnung vorbereiten
      const invoiceTotals = {
        subtotalNet: invoiceNet,
        discountPercent: 0,
        discountAmount: 0,
        netTotal: invoiceNet,
        taxRate: taxRate,
        taxAmount: taxAmount,
        grossTotal: invoiceGross
      };

      const invoiceData = {
        // Referenz zum Angebot
        offerID: offer.id,
        offerNumber: offer.offerNumber,
        // Rechnungstyp
        invoiceType,
        invoicePercent,
        // Referenz zur Anzahlungsrechnung (bei Schlussrechnung)
        depositInvoiceID: invoiceType === INVOICE_TYPE.FINAL ? depositInvoice?.id : null,
        depositInvoiceNumber: invoiceType === INVOICE_TYPE.FINAL ? depositInvoice?.invoiceNumber : null,
        depositAmount: invoiceType === INVOICE_TYPE.FINAL ? (depositInvoice?.totals?.grossTotal || offerGrossTotal * depositPercent / 100) : 0,
        // Kundendaten übernehmen
        customerID: offer.customerID,
        projectID: offer.projectID,
        // Positionen
        items: invoiceItems,
        // Vorberechnete Totals
        totals: invoiceTotals,
        skipTotalsCalculation: true, // Flag um Neuberechnung zu verhindern
        // Originale Angebotsdaten für Referenz
        offerTotals: offer.totals,
        offerDepositPercent: depositPercent,
        // Notizen
        notes
      };

      return createInvoice(invoiceData);
    } catch (err) {
      console.error('Error creating invoice from offer:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [createInvoice, hasDepositInvoice, getDepositInvoice]);

  // Hilfsfunktionen für Formatierung
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const formatDateSimple = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  // Rechnung aktualisieren
  const updateInvoice = useCallback(async (invoiceId, invoiceData, changeDescription = 'Aktualisiert') => {
    try {
      setLoading(true);

      const existingInvoice = invoices.find(i => i.id === invoiceId);
      if (!existingInvoice) {
        throw new Error('Rechnung nicht gefunden');
      }

      // Summen neu berechnen
      const totals = calculateOfferTotals(invoiceData.items || [], invoiceData.totals?.discountPercent || 0);

      // Version erhöhen und History aktualisieren
      const newVersion = (existingInvoice.version || 1) + 1;
      const history = [
        ...(existingInvoice.history || []),
        {
          version: newVersion,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || 'system',
          changes: changeDescription
        }
      ];

      const updatedInvoice = {
        ...invoiceData,
        totals,
        version: newVersion,
        history
      };

      await InvoiceService.updateInvoice(invoiceId, updatedInvoice);
      return { success: true };
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [invoices, calculateOfferTotals, user]);

  // Rechnung löschen
  const deleteInvoice = useCallback(async (invoiceId) => {
    try {
      setLoading(true);
      await InvoiceService.deleteInvoice(invoiceId);
      return { success: true };
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Status ändern
  const updateInvoiceStatus = useCallback(async (invoiceId, newStatus) => {
    try {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) {
        throw new Error('Rechnung nicht gefunden');
      }

      const statusData = {
        status: newStatus
      };

      // Zusätzliche Timestamps je nach Status
      if (newStatus === INVOICE_STATUS.SENT) {
        statusData.sentAt = new Date().toISOString();
      } else if (newStatus === INVOICE_STATUS.PAID) {
        statusData.paidAt = new Date().toISOString();
      } else if (newStatus === INVOICE_STATUS.CANCELLED) {
        statusData.cancelledAt = new Date().toISOString();
      }

      await InvoiceService.updateInvoice(invoiceId, {
        ...invoice,
        ...statusData,
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

      return { success: true };
    } catch (err) {
      console.error('Error updating invoice status:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [invoices, user]);

  // Rechnungen nach Kunde
  const getInvoicesByCustomer = useCallback((customerId) => {
    return invoices.filter(i => i.customerID === customerId);
  }, [invoices]);

  // Rechnungen nach Angebot
  const getInvoicesByOffer = useCallback((offerId) => {
    return invoices.filter(i => i.offerID === offerId);
  }, [invoices]);

  // Rechnungen nach Status
  const getInvoicesByStatus = useCallback((status) => {
    return invoices.filter(i => i.status === status);
  }, [invoices]);

  // Rechnung nach ID
  const getInvoiceById = useCallback((invoiceId) => {
    return invoices.find(i => i.id === invoiceId);
  }, [invoices]);

  // Überfällige Rechnungen prüfen und Status aktualisieren
  const checkOverdueInvoices = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    for (const invoice of invoices) {
      if (
        invoice.status === INVOICE_STATUS.SENT &&
        invoice.dueDate &&
        invoice.dueDate < today
      ) {
        await updateInvoiceStatus(invoice.id, INVOICE_STATUS.OVERDUE);
      }
    }
  }, [invoices, updateInvoiceStatus]);

  // Statistiken
  const getStatistics = useCallback(() => {
    const stats = {
      total: invoices.length,
      byStatus: {},
      totalValue: 0,
      paidValue: 0,
      openValue: 0
    };

    Object.keys(INVOICE_STATUS).forEach(key => {
      stats.byStatus[INVOICE_STATUS[key]] = invoices.filter(i => i.status === INVOICE_STATUS[key]).length;
    });

    invoices.forEach(invoice => {
      const value = invoice.totals?.grossTotal || 0;
      stats.totalValue += value;
      if (invoice.status === INVOICE_STATUS.PAID) {
        stats.paidValue += value;
      } else if (invoice.status === INVOICE_STATUS.SENT || invoice.status === INVOICE_STATUS.OVERDUE) {
        stats.openValue += value;
      }
    });

    return stats;
  }, [invoices]);

  const value = {
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
    INVOICE_STATUS,
    INVOICE_STATUS_LABELS,
    INVOICE_TYPE,
    INVOICE_TYPE_LABELS
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};
