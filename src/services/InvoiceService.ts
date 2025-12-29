/**
 * Invoice Service
 *
 * Zentrale Business-Logik für Invoice-Operationen
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import type { InvoiceVisibleColumns, InvoiceFormData, ValidationErrors } from '@app-types/components/invoice.types';
import { DEFAULT_INVOICE_COLUMNS, mergeInvoiceColumnPreferences } from '@utils/invoiceHelpers';

// ============================================
// PREFERENCES SERVICE
// ============================================

/**
 * Lädt die Spalteneinstellungen für Invoices aus Firebase
 *
 * @param userId - Benutzer-ID
 * @returns Promise mit Spalteneinstellungen
 */
export const loadInvoiceColumnPreferences = async (
  userId: string | null | undefined
): Promise<InvoiceVisibleColumns> => {
  if (!userId) {
    return { ...DEFAULT_INVOICE_COLUMNS };
  }

  try {
    const prefsDoc = await getDoc(doc(db, 'user-preferences', userId));
    if (prefsDoc.exists()) {
      const prefs = prefsDoc.data();
      return mergeInvoiceColumnPreferences(prefs.invoiceColumns);
    }
  } catch (error) {
    console.error('Fehler beim Laden der Invoice-Spalteneinstellungen:', error);
  }

  return { ...DEFAULT_INVOICE_COLUMNS };
};

/**
 * Speichert die Spalteneinstellungen für Invoices in Firebase
 *
 * @param userId - Benutzer-ID
 * @param columns - Spalteneinstellungen
 */
export const saveInvoiceColumnPreferences = async (
  userId: string | null | undefined,
  columns: InvoiceVisibleColumns
): Promise<void> => {
  if (!userId) return;

  try {
    const prefsRef = doc(db, 'user-preferences', userId);
    const prefsDoc = await getDoc(prefsRef);
    const existingPrefs = prefsDoc.exists() ? prefsDoc.data() : {};

    await setDoc(prefsRef, {
      ...existingPrefs,
      invoiceColumns: columns
    });
  } catch (error) {
    console.error('Fehler beim Speichern der Invoice-Spalteneinstellungen:', error);
    throw error;
  }
};

// ============================================
// VALIDATION SERVICE
// ============================================

/**
 * Validiert den Kundenschritt im Invoice-Konfigurator
 *
 * @param selectedCustomer - Ausgewählter Kunde
 * @param selectedProject - Ausgewähltes Projekt
 * @returns Validierungsfehler oder leeres Objekt
 */
export const validateCustomerStep = (
  selectedCustomer: string,
  selectedProject: string
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!selectedCustomer) {
    errors.customer = 'Bitte wählen Sie einen Kunden aus';
  }

  if (!selectedProject) {
    errors.project = 'Bitte wählen Sie ein Projekt aus';
  }

  return errors;
};

/**
 * Validiert den Services-Schritt im Invoice-Konfigurator
 *
 * @param invoiceData - Invoice-Formulardaten
 * @returns Validierungsfehler oder leeres Objekt
 */
export const validateServicesStep = (invoiceData: InvoiceFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!invoiceData.items || invoiceData.items.length === 0) {
    errors.items = 'Bitte fügen Sie mindestens eine Position hinzu';
  }

  return errors;
};

/**
 * Validiert alle Pflichtfelder basierend auf dem aktuellen Schritt
 *
 * @param step - Aktueller Schritt (0-basiert)
 * @param selectedCustomer - Ausgewählter Kunde
 * @param selectedProject - Ausgewähltes Projekt
 * @param invoiceData - Invoice-Formulardaten
 * @returns Validierungsfehler oder leeres Objekt
 */
export const validateInvoiceStep = (
  step: number,
  selectedCustomer: string,
  selectedProject: string,
  invoiceData: InvoiceFormData
): ValidationErrors => {
  switch (step) {
    case 0:
      return validateCustomerStep(selectedCustomer, selectedProject);
    case 1:
      return validateServicesStep(invoiceData);
    default:
      return {};
  }
};

/**
 * Prüft ob Validierungsfehler vorhanden sind
 *
 * @param errors - Validierungsfehler-Objekt
 * @returns true wenn Fehler vorhanden
 */
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// ============================================
// CALCULATION SERVICE
// ============================================

/**
 * Berechnet die Summen für eine Invoice
 *
 * @param items - Invoice-Items
 * @param vatRate - MwSt-Satz (default: 19)
 * @returns Berechnete Summen
 */
export const calculateInvoiceTotals = (
  items: InvoiceFormData['items'],
  vatRate: number = 19
): {
  subtotal: number;
  vatAmount: number;
  total: number;
} => {
  const subtotal = items.reduce((sum, item) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPriceNet || 0;
    const discount = item.discount || 0;
    const itemTotal = quantity * unitPrice * (1 - discount / 100);
    return sum + itemTotal;
  }, 0);

  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  return {
    subtotal,
    vatAmount,
    total
  };
};
