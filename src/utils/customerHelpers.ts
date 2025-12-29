/**
 * Customer Helper Utilities
 * Zentrale Hilfsfunktionen für Kundenverwaltung
 */

import type { Customer, Project } from '@app-types';

/**
 * Berechnet die nächste Kunden-ID basierend auf existierenden Kunden
 *
 * @param customers - Liste existierender Kunden
 * @returns Nächste verfügbare Kunden-ID im Format "KUN-XXX"
 *
 * @example
 * computeNextCustomerId(customers) // "KUN-042"
 */
export const computeNextCustomerId = (customers: Customer[] = []): string => {
  const regex = /^KUN-(\d{3,})$/;
  const max = customers.reduce((acc, c) => {
    const id = c?.customerID;
    if (!id || typeof id !== 'string') return acc;
    const m = id.match(regex);
    if (!m) return acc;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `KUN-${String(max + 1).padStart(3, '0')}`;
};

/**
 * Berechnet die nächste Projekt-ID basierend auf existierenden Projekten
 *
 * @param projects - Liste existierender Projekte
 * @returns Nächste verfügbare Projekt-ID im Format "PRO-XXX"
 *
 * @example
 * computeNextProjectId(projects) // "PRO-015"
 */
export const computeNextProjectId = (projects: Project[] = []): string => {
  const regex = /^PRO-(\d{3,})$/;
  const max = projects.reduce((acc, p) => {
    const id = (p as any)?.projectID;
    if (!id || typeof id !== 'string') return acc;
    const m = id.match(regex);
    if (!m) return acc;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `PRO-${String(max + 1).padStart(3, '0')}`;
};

/**
 * Generiert eine zufällige 4-stellige Zahl als String
 *
 * @returns 4-stellige Zufallszahl (z.B. "0042")
 *
 * @example
 * random4() // "0042"
 */
export const random4 = (): string =>
  String(Math.floor(Math.random() * 10000)).padStart(4, '0');

/**
 * Bereinigt den Kundennamen für die Verwendung in Projekt-IDs
 *
 * @param name - Kundenname
 * @returns Bereinigter Name (max. 20 Zeichen, nur alphanumerisch)
 *
 * @example
 * sanitizeCustomerName("Müller & Söhne GmbH") // "MüllerSöhneGmbH"
 */
export const sanitizeCustomerName = (name: string | null | undefined): string => {
  if (!name) return '';
  return name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '').substring(0, 20);
};

/**
 * Adress-Komponenten Interface
 */
export interface AddressParts {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
}

/**
 * Erstellt eine formatierte Adresse aus den Einzelteilen
 *
 * @param parts - Adress-Komponenten
 * @returns Formatierte Adresse
 *
 * @example
 * addressFromParts({ street: 'Hauptstr.', houseNumber: '1', postalCode: '12345', city: 'Berlin' })
 * // "Hauptstr. 1, 12345 Berlin"
 */
export const addressFromParts = ({ street, houseNumber, postalCode, city }: AddressParts): string => {
  const s = (street || '').trim();
  const h = (houseNumber || '').trim();
  const p = (postalCode || '').trim();
  const c = (city || '').trim();

  if (!s && !h && !p && !c) return '';

  return `${s} ${h}, ${p} ${c}`
    .replace(/\s+,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

/**
 * Utility-Funktion für CSS-Klassen-Verkettung
 *
 * @param classes - CSS-Klassen (können false/null/undefined sein)
 * @returns Verkettete CSS-Klassen
 *
 * @example
 * cn('base', isActive && 'active', 'other') // "base active other"
 */
export const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

/**
 * Standard-Spalten für Kundentabelle
 */
export const DEFAULT_CUSTOMER_COLUMNS = {
  kunde: true,
  adresse: true,
  telefon: false,
  email: false,
  aktionen: true
};

/**
 * Verfügbare Spalten-Definition für Kundentabelle
 */
export const CUSTOMER_AVAILABLE_COLUMNS = [
  { key: 'kunde', label: 'Kunde', required: true },
  { key: 'adresse', label: 'Adresse' },
  { key: 'telefon', label: 'Telefon' },
  { key: 'email', label: 'Email' },
  { key: 'aktionen', label: 'Aktionen', required: true }
];

/**
 * Zeitraum-Filter-Optionen
 */
export const DATE_RANGE_OPTIONS = [
  { value: 'alle', label: 'Alle Zeiträume' },
  { value: 'heute', label: 'Heute' },
  { value: '7tage', label: 'Letzte 7 Tage' },
  { value: '30tage', label: 'Letzte 30 Tage' },
  { value: '90tage', label: 'Letzte 90 Tage' },
  { value: 'jahr', label: 'Letztes Jahr' }
];
