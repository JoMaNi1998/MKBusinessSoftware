/**
 * Booking Aggregation Service
 * Zentrale Logik für die Aggregation von Buchungen (OUT - IN)
 *
 * Berechnet Netto-Mengen und -Kosten pro Material unter
 * Berücksichtigung von Ein- und Ausgängen.
 */

import type { Material } from '@app-types';
import type { ExtendedBooking } from '@app-types/contexts/booking.types';
import { BookingType } from '@app-types/enums';
import { toNumber } from '../utils';

// ============================================
// INTERFACES
// ============================================

/**
 * Aggregiertes Material mit OUT-IN Berechnung
 */
export interface AggregatedMaterial {
  materialId: string;
  materialID: string;
  description: string;

  // Mengen
  outQuantity: number;      // Summe aller OUT-Buchungen
  inQuantity: number;       // Summe aller IN-Buchungen
  netQuantity: number;      // OUT - IN

  // Kosten
  outCost: number;
  inCost: number;
  netCost: number;
  avgPricePerUnit: number;

  // Kategorie-Flags
  isConfigured: boolean;
  isManual: boolean;

  // Material-Info
  itemsPerUnit: number;
  unit: string;
  category: string;
  categoryId: string | null;
}

/**
 * Validierungsergebnis für IN-Buchungen auf Projekte
 */
export interface InBookingValidationResult {
  isValid: boolean;
  errors: Array<{
    materialId: string;
    materialName: string;
    requested: number;
    maxAllowed: number;
  }>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Erstellt ein leeres AggregatedMaterial Objekt
 */
const createEmptyAggregation = (
  material: Material,
  bm: { isConfigured?: boolean; isManual?: boolean }
): AggregatedMaterial => ({
  materialId: material.id || '',
  materialID: material.materialID || '',
  description: material.description || material.bezeichnung || material.materialID || 'Material',
  outQuantity: 0,
  inQuantity: 0,
  netQuantity: 0,
  outCost: 0,
  inCost: 0,
  netCost: 0,
  avgPricePerUnit: 0,
  isConfigured: (bm as any).isConfigured || false,
  isManual: (bm as any).isManual || false,
  itemsPerUnit: toNumber(material.itemsPerUnit, 1),
  unit: material.einheit || 'Stück',
  category: material.kategorie || '',
  categoryId: material.categoryId ?? null
});

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Aggregiert Buchungen für ein Projekt und berechnet Netto-Mengen/Kosten
 *
 * Formel: Netto = Summe(OUT) - Summe(IN)
 *
 * @param projectId - Projekt-ID
 * @param bookings - Alle Buchungen
 * @param materials - Alle Materialien
 * @returns Aggregierte Materialien mit netQuantity > 0
 *
 * @example
 * const items = aggregateProjectBookings(project.id, bookings, materials);
 * const totalCost = items.reduce((sum, item) => sum + item.netCost, 0);
 */
export const aggregateProjectBookings = (
  projectId: string,
  bookings: ExtendedBooking[],
  materials: Material[]
): AggregatedMaterial[] => {
  if (!projectId) return [];

  const map = new Map<string, AggregatedMaterial>();

  // Alle Buchungen für dieses Projekt
  const projectBookings = bookings.filter(b => b?.projectID === projectId);

  for (const booking of projectBookings) {
    const isOut = booking.type === BookingType.OUT;
    const isIn = booking.type === BookingType.IN;

    // Nur OUT und IN Buchungen verarbeiten
    if (!isOut && !isIn) continue;

    const bookingMaterials = Array.isArray(booking?.materials) ? booking.materials : [];

    for (const bm of bookingMaterials) {
      // Material im Master finden
      const material = materials.find(
        m => m?.id === bm?.materialID || m?.materialID === bm?.materialID
      );

      if (!material) continue;

      const key = material.id || material.materialID || material.description || 'unknown';
      const quantity = toNumber(bm.quantity, 0);
      const priceAtBooking = toNumber(bm.priceAtBooking, material.price || 0);
      const cost = toNumber(bm.totalCost, priceAtBooking * quantity);

      // Bestehende Aggregation oder neue erstellen
      const existing = map.get(key) || createEmptyAggregation(material, bm);

      if (isOut) {
        existing.outQuantity += quantity;
        existing.outCost += cost;
      } else if (isIn) {
        existing.inQuantity += quantity;
        existing.inCost += cost;
      }

      // Netto-Werte berechnen
      existing.netQuantity = existing.outQuantity - existing.inQuantity;
      existing.netCost = existing.outCost - existing.inCost;
      existing.avgPricePerUnit = existing.netQuantity > 0
        ? existing.netCost / existing.netQuantity
        : 0;

      // Flags OR-verknüpfen
      existing.isConfigured = existing.isConfigured || (bm as any).isConfigured || false;
      existing.isManual = existing.isManual || (bm as any).isManual || false;

      map.set(key, existing);
    }
  }

  // Nur Materialien mit netQuantity > 0 zurückgeben, sortiert nach Beschreibung
  return Array.from(map.values())
    .filter(m => m.netQuantity > 0)
    .sort((a, b) => {
      const cmp = a.description.localeCompare(b.description, 'de', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return a.materialID.localeCompare(b.materialID, 'de', { sensitivity: 'base' });
    });
};

/**
 * Ermittelt die maximale rückbuchbare Menge für ein Material
 *
 * @param projectId - Projekt-ID
 * @param materialId - Material-ID
 * @param bookings - Alle Buchungen
 * @param materials - Alle Materialien
 * @returns Maximale Menge die zurückgebucht werden kann (OUT - IN)
 */
export const getMaxReturnableQuantity = (
  projectId: string,
  materialId: string,
  bookings: ExtendedBooking[],
  materials: Material[]
): number => {
  const aggregated = aggregateProjectBookings(projectId, bookings, materials);
  const item = aggregated.find(
    m => m.materialId === materialId || m.materialID === materialId
  );
  // Maximale Rückgabe = netQuantity (OUT - IN)
  return item?.netQuantity || 0;
};

/**
 * Validiert eine IN-Buchung auf ein Projekt
 *
 * Prüft ob die angeforderten Mengen nicht die bereits
 * ausgebuchten Mengen (OUT - IN) übersteigen.
 *
 * @param projectId - Projekt-ID
 * @param materialsToBook - Materialien mit Mengen die gebucht werden sollen
 * @param bookings - Alle Buchungen
 * @param materials - Alle Materialien
 * @returns Validierungsergebnis mit Fehlern falls vorhanden
 *
 * @example
 * const validation = validateProjectInBooking(
 *   projectId,
 *   [{ materialId: 'mat-1', quantity: 5 }],
 *   bookings,
 *   materials
 * );
 * if (!validation.isValid) {
 *   showNotification(validation.errors[0].materialName + ' überschreitet Maximum');
 * }
 */
export const validateProjectInBooking = (
  projectId: string,
  materialsToBook: Array<{ materialId: string; quantity: number }>,
  bookings: ExtendedBooking[],
  materials: Material[]
): InBookingValidationResult => {
  const errors: InBookingValidationResult['errors'] = [];

  for (const item of materialsToBook) {
    const maxAllowed = getMaxReturnableQuantity(
      projectId,
      item.materialId,
      bookings,
      materials
    );

    if (item.quantity > maxAllowed) {
      const material = materials.find(
        m => m.id === item.materialId || m.materialID === item.materialId
      );
      errors.push({
        materialId: item.materialId,
        materialName: material?.description || item.materialId,
        requested: item.quantity,
        maxAllowed
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Teilt aggregierte Materialien in Kategorien auf
 *
 * @param items - Aggregierte Materialien
 * @returns Objekt mit 3 Kategorien
 */
export const splitAggregatedByCategory = (
  items: AggregatedMaterial[]
): {
  manualItems: AggregatedMaterial[];
  configuredItems: AggregatedMaterial[];
  autoItems: AggregatedMaterial[];
} => {
  return {
    manualItems: items.filter(item => item.isManual),
    configuredItems: items.filter(item => item.isConfigured && !item.isManual),
    autoItems: items.filter(item => !item.isConfigured && !item.isManual)
  };
};

// ============================================
// DEFAULT EXPORT
// ============================================

const BookingAggregationService = {
  aggregateProjectBookings,
  getMaxReturnableQuantity,
  validateProjectInBooking,
  splitAggregatedByCategory
};

export default BookingAggregationService;
