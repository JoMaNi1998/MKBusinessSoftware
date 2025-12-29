/**
 * BOM (Bill of Materials) Service
 * Zentrale Logik für Stücklisten-Berechnungen
 */

import type { BOMItem } from '@app-types/components/bom.types';
import type { Project, Material } from '@app-types';
import type { ExtendedBooking } from '@app-types/contexts/booking.types';
import { BookingType } from '@app-types/enums';
import { toNumber } from '../utils';

/**
 * Berechnet die Stückliste aus Buchungen für ein Projekt
 *
 * Aggregiert alle Ausgangs-Buchungen eines Projekts und
 * erstellt eine konsolidierte Materialliste.
 *
 * @param project - Das Projekt für das die BOM berechnet werden soll
 * @param bookings - Alle verfügbaren Buchungen
 * @param materials - Alle verfügbaren Materialien
 * @returns Sortierte Liste von BOM-Items
 *
 * @example
 * const bomItems = computeBOMFromBookings(project, bookings, materials);
 */
export const computeBOMFromBookings = (
  project: Project | null,
  bookings: ExtendedBooking[],
  materials: Material[]
): BOMItem[] => {
  if (!project) return [];

  // NUR Buchungen des Projekts vom Typ "Ausgang"
  const projectBookings = bookings.filter(
    (b) => b?.projectID === project.id && b?.type === BookingType.OUT
  );

  const map = new Map<string, BOMItem>();

  for (const booking of projectBookings) {
    const bookingMaterials = Array.isArray(booking?.materials) ? booking.materials : [];

    for (const bm of bookingMaterials) {
      // Material im Master finden (robuste Matches)
      const material = materials.find(
        (m) => m?.id === bm?.materialID || m?.materialID === bm?.materialID
      );

      if (!material) continue;

      const key = material.id || material.materialID || material.description || 'unknown';
      const itemsPerUnit = toNumber(material.itemsPerUnit, 1);
      const unit = material.einheit || 'Stück';
      const description = material.description || material.bezeichnung || material.materialID || 'Material';
      const quantity = toNumber(bm.quantity, 0);

      // isConfigured und isManual aus dem BookingMaterial übernehmen
      const bmIsConfigured = (bm as any).isConfigured || false;
      const bmIsManual = (bm as any).isManual || false;

      if (map.has(key)) {
        const prev = map.get(key)!;
        const newQuantity = prev.quantity + quantity;
        map.set(key, {
          ...prev,
          quantity: newQuantity,
          totalUnits: itemsPerUnit * newQuantity,
          isConfigured: prev.isConfigured || bmIsConfigured,
          isManual: prev.isManual || bmIsManual
        });
      } else {
        map.set(key, {
          key,
          id: material.id || material.materialID || key,
          materialID: material.materialID || '',
          description,
          unit,
          itemsPerUnit,
          quantity,
          totalUnits: itemsPerUnit * quantity,
          categoryId: material.categoryId ?? null,
          isConfigured: bmIsConfigured,
          isManual: bmIsManual,
          category: material.kategorie || ''
        });
      }
    }
  }

  // Sortiert nach Beschreibung, dann nach materialID
  return Array.from(map.values()).sort((a, b) => {
    const descA = a.description || '';
    const descB = b.description || '';
    const cmp = descA.localeCompare(descB, 'de', { sensitivity: 'base' });
    if (cmp !== 0) return cmp;
    return (a.materialID || '').localeCompare(b.materialID || '', 'de', { sensitivity: 'base' });
  });
};

/**
 * Berechnet Mengen-Änderung für ein BOM-Item
 *
 * @param item - Das zu aktualisierende Item
 * @param newQuantity - Die neue Menge
 * @returns Aktualisiertes BOM-Item oder null wenn Menge 0
 */
export const updateBOMItemQuantity = (
  item: BOMItem,
  newQuantity: number | string
): BOMItem | null => {
  const quantity = Math.max(0, toNumber(newQuantity, 0));

  if (quantity === 0) {
    return null;
  }

  return {
    ...item,
    quantity,
    totalUnits: (item.itemsPerUnit || 1) * quantity
  };
};

/**
 * Filtert BOM-Items nach Konfigurationsstatus
 *
 * @param items - Alle BOM-Items
 * @returns Objekt mit configuredItems und autoItems
 */
export const splitBOMItemsByConfiguration = (
  items: BOMItem[]
): { configuredItems: BOMItem[]; autoItems: BOMItem[] } => {
  return {
    configuredItems: items.filter(item => item.isConfigured),
    autoItems: items.filter(item => !item.isConfigured)
  };
};

const BOMService = {
  computeBOMFromBookings,
  updateBOMItemQuantity,
  splitBOMItemsByConfiguration
};

export default BOMService;
