/**
 * Booking Helper Utilities
 * Zentrale Hilfsfunktionen für Buchungen
 */

import type { BookingType } from '@app-types';

/**
 * Gibt die CSS-Klassen für die Buchungstyp-Farbe zurück
 *
 * @param type - Der Buchungstyp
 * @returns CSS-Klassen für Badge-Styling
 *
 * @example
 * getBookingTypeColor('in') // 'bg-green-100 text-green-800'
 * getBookingTypeColor('out') // 'bg-red-100 text-red-800'
 */
export const getBookingTypeColor = (type: BookingType): string => {
  switch (type) {
    case 'in':
      return 'bg-green-100 text-green-800';
    case 'out':
      return 'bg-red-100 text-red-800';
    case 'correction':
      return 'bg-orange-100 text-orange-800';
    case 'inventory':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Gibt das deutsche Label für den Buchungstyp zurück
 *
 * @param type - Der Buchungstyp
 * @returns Deutsches Label
 *
 * @example
 * getBookingTypeLabel('in') // 'Eingang'
 * getBookingTypeLabel('out') // 'Ausgang'
 */
export const getBookingTypeLabel = (type: BookingType): string => {
  switch (type) {
    case 'in':
      return 'Eingang';
    case 'out':
      return 'Ausgang';
    case 'correction':
      return 'Korrektur';
    case 'inventory':
      return 'Inventur';
    default:
      return type;
  }
};

/**
 * Gibt den Icon-Namen für den Buchungstyp zurück
 *
 * @param type - Der Buchungstyp
 * @returns Lucide Icon-Name
 *
 * @example
 * getBookingTypeIconName('in') // 'TrendingUp'
 * getBookingTypeIconName('out') // 'TrendingDown'
 */
export const getBookingTypeIconName = (type: BookingType): string => {
  switch (type) {
    case 'in':
      return 'TrendingUp';
    case 'out':
      return 'TrendingDown';
    case 'correction':
      return 'Edit';
    case 'inventory':
      return 'Package';
    default:
      return 'Circle';
  }
};

/**
 * Prüft ob es sich um einen Eingang handelt
 *
 * @param type - Der Buchungstyp
 * @returns true wenn Eingang
 */
export const isIncomingBooking = (type: BookingType): boolean => {
  return type === 'in';
};

/**
 * Prüft ob es sich um einen Ausgang handelt
 *
 * @param type - Der Buchungstyp
 * @returns true wenn Ausgang
 */
export const isOutgoingBooking = (type: BookingType): boolean => {
  return type === 'out';
};

/**
 * Berechnet die Bestandsänderung basierend auf Buchungstyp
 *
 * @param type - Der Buchungstyp
 * @param quantity - Die Menge
 * @returns Positive Zahl für Eingang, negative für Ausgang
 *
 * @example
 * calculateStockChange('in', 10) // 10
 * calculateStockChange('out', 10) // -10
 */
export const calculateStockChange = (type: BookingType, quantity: number): number => {
  return isIncomingBooking(type) ? quantity : -quantity;
};

/**
 * Konstante für Lagerbuchung (Wareneingang ohne Kunde)
 */
export const WAREHOUSE_BOOKING = 'Lagerbuchung';

/**
 * Standard Items pro Seite für Pagination
 */
export const BOOKING_ITEMS_PER_PAGE = 20;
