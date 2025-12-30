/**
 * Booking Service
 * Zentrale Business-Logik für Buchungen
 */

import type { Material, Project } from '@app-types';
import type { SelectedMaterial } from '@app-types/components/booking.types';
import type { BookingMaterial } from '@app-types/contexts/booking.types';
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

// ============================================
// BOOKING DATA CREATION (DRY)
// ============================================

/**
 * Optionen für createBookingMaterial
 */
export interface BookingMaterialOptions {
  isConfigured?: boolean;
  isManual?: boolean;
}

/**
 * Erstellt ein BookingMaterial-Objekt aus einem Material
 *
 * Zentrale Funktion für konsistente Buchungs-Daten mit Preis-Tracking.
 *
 * @param material - Das Material
 * @param quantity - Die Menge
 * @param options - Optionale Flags (isConfigured, isManual)
 * @returns BookingMaterial mit priceAtBooking und totalCost
 *
 * @example
 * const bm = createBookingMaterial(material, 5, { isManual: true });
 */
export const createBookingMaterial = (
  material: Material,
  quantity: number,
  options?: BookingMaterialOptions
): BookingMaterial & { isConfigured: boolean; isManual: boolean } => {
  const priceAtBooking = material.price || material.purchasePrice || 0;
  return {
    materialID: material.materialID || material.id || '',
    materialName: material.description || material.bezeichnung || '',
    description: material.description || material.bezeichnung || '',
    quantity,
    priceAtBooking,
    totalCost: priceAtBooking * quantity,
    isConfigured: options?.isConfigured || false,
    isManual: options?.isManual || false
  };
};

/**
 * Parameter für createBookingData
 */
export interface CreateBookingParams {
  type: BookingType;
  materials: Array<{
    material: Material;
    quantity: number;
    isConfigured?: boolean;
    isManual?: boolean;
  }>;
  project?: Project | null;
  customerID?: string;
  customerName?: string;
  notes?: string;
}

/**
 * Erstellt ein komplettes Buchungs-Datenobjekt
 *
 * Zentrale Funktion für konsistente Buchungen mit allen erforderlichen Feldern.
 *
 * @param params - Buchungsparameter
 * @returns Buchungs-Datenobjekt ready für addBooking()
 *
 * @example
 * const bookingData = createBookingData({
 *   type: BookingType.OUT,
 *   materials: [{ material, quantity: 5, isManual: true }],
 *   project,
 *   notes: 'Ausgebucht für Baustelle'
 * });
 * await addBooking(bookingData);
 */
export const createBookingData = (params: CreateBookingParams) => {
  const { type, materials, project, customerID, customerName, notes } = params;

  const bookingMaterials = materials.map(item =>
    createBookingMaterial(item.material, item.quantity, {
      isConfigured: item.isConfigured,
      isManual: item.isManual
    })
  );

  const defaultCustomerName = type === BookingType.IN
    ? 'Wareneingang'
    : 'Warenausgang';

  const defaultNotes = type === BookingType.IN
    ? 'Eingang gebucht'
    : project
      ? `Ausgebucht für Projekt: ${project.name}`
      : 'Ausgang gebucht';

  return {
    type,
    customerID: project?.customerID || customerID || '',
    customerName: project?.customerName || customerName || defaultCustomerName,
    projectID: project?.id || '',
    projectName: project?.name || '',
    materials: bookingMaterials,
    notes: notes || defaultNotes
  };
};

const BookingService = {
  validateBookingForm,
  hasValidationErrors,
  executeStockUpdates,
  resetOrderStatus,
  generateBookingId,
  createBookingMaterial,
  createBookingData
};

export default BookingService;
