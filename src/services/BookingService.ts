/**
 * Booking Service
 * Zentrale Business-Logik für Buchungen
 */

import type { Material } from '@app-types';
import type { SelectedMaterial } from '@app-types/components/booking.types';
import { BookingType } from '@app-types/enums';
import { WAREHOUSE_BOOKING, calculateStockChange } from '../utils/bookingHelpers';
import { FirebaseService } from './firebaseService';

/**
 * Validierungsfehler-Objekt
 */
export interface BookingValidationErrors {
  customer?: string;
  project?: string;
  materials?: string;
  [key: string]: string | undefined;
}

/**
 * Buchungs-Update für Rollback
 */
interface BookingUpdate {
  materialId: string;
  stockChange: number;
}

/**
 * Ergebnis einer Buchungsausführung
 */
export interface BookingExecutionResult {
  success: boolean;
  error?: string;
  updates?: BookingUpdate[];
}

/**
 * Validiert das Buchungsformular
 *
 * @param selectedCustomer - Ausgewählter Kunde
 * @param selectedProject - Ausgewähltes Projekt
 * @param selectedMaterials - Ausgewählte Materialien
 * @param materials - Alle Materialien
 * @param type - Buchungstyp
 * @returns Validierungsfehler oder leeres Objekt
 */
export const validateBookingForm = (
  selectedCustomer: string,
  selectedProject: string,
  selectedMaterials: SelectedMaterial[],
  materials: Material[],
  type: BookingType
): BookingValidationErrors => {
  const errors: BookingValidationErrors = {};

  if (!selectedCustomer) {
    errors.customer = 'Bitte wählen Sie einen Kunden aus';
  }

  if (!selectedProject && selectedCustomer !== WAREHOUSE_BOOKING) {
    errors.project = 'Bitte wählen Sie ein Projekt aus';
  }

  if (selectedMaterials.length === 0) {
    errors.materials = 'Bitte wählen Sie mindestens ein Material aus';
  }

  // Stock validation for outgoing bookings
  if (type === BookingType.OUT) {
    selectedMaterials.forEach((item, index) => {
      const material = materials.find(m => m.id === item.materialId);
      if (material && item.quantity > (material.stock ?? 0)) {
        errors[`quantity_${index}`] = `Nicht genügend Lagerbestand (verfügbar: ${material.stock ?? 0})`;
      }
    });
  }

  return errors;
};

/**
 * Prüft ob Validierungsfehler vorhanden sind
 *
 * @param errors - Validierungsfehler-Objekt
 * @returns true wenn Fehler vorhanden
 */
export const hasValidationErrors = (errors: BookingValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Führt Bestandsaktualisierungen mit Rollback-Support durch
 *
 * @param selectedMaterials - Ausgewählte Materialien
 * @param type - Buchungstyp
 * @param updateMaterialStock - Funktion zum Aktualisieren des Bestands
 * @returns Ausführungsergebnis
 */
export const executeStockUpdates = async (
  selectedMaterials: SelectedMaterial[],
  type: BookingType,
  updateMaterialStock: (id: string, change: number) => Promise<void>
): Promise<BookingExecutionResult> => {
  const successfulUpdates: BookingUpdate[] = [];

  try {
    for (const item of selectedMaterials) {
      const stockChange = calculateStockChange(type, item.quantity);
      await updateMaterialStock(item.materialId, stockChange);
      successfulUpdates.push({ materialId: item.materialId, stockChange });
    }

    return { success: true, updates: successfulUpdates };
  } catch (error) {
    // Rollback on error
    console.error('Fehler bei Buchung, führe Rollback durch:', error);

    for (const update of successfulUpdates) {
      try {
        await updateMaterialStock(update.materialId, -update.stockChange);
      } catch (rollbackError) {
        console.error('Rollback fehlgeschlagen für Material:', update.materialId, rollbackError);
      }
    }

    return {
      success: false,
      error: 'Buchung fehlgeschlagen. Änderungen wurden rückgängig gemacht.'
    };
  }
};

/**
 * Setzt den Bestellstatus eines Materials zurück (nach Wareneingang)
 *
 * @param materialId - Material-ID
 */
export const resetOrderStatus = async (materialId: string): Promise<void> => {
  try {
    await FirebaseService.updateDocument('materials', materialId, {
      orderStatus: null,
      orderDate: null,
      orderedQuantity: 0,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Bestellstatus:', error);
  }
};

/**
 * Generiert eine eindeutige Buchungs-ID
 *
 * @param type - Buchungstyp
 * @param projectId - Projekt-ID
 * @returns Eindeutige Buchungs-ID
 */
export const generateBookingId = (type: BookingType, projectId: string): string => {
  return `${type}-${projectId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const BookingService = {
  validateBookingForm,
  hasValidationErrors,
  executeStockUpdates,
  resetOrderStatus,
  generateBookingId
};

export default BookingService;
