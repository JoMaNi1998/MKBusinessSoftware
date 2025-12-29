/**
 * Customer Service
 * Zentrale Business-Logik für Kundenverwaltung
 */

import { FirebaseService } from './firebaseService';
import type { Project, Material } from '@app-types';
import type { ExtendedBooking } from '@app-types/contexts/booking.types';
import type { CustomerFormData, CustomerFormErrors } from '@app-types/components/customer.types';

/**
 * Berechnet die Gesamtkosten eines Kunden basierend auf seinen Projekten und Buchungen
 *
 * @param customerProjects - Projekte des Kunden
 * @param bookings - Alle Buchungen
 * @returns Gesamtkosten in Euro
 *
 * @example
 * const costs = await calculateCustomerTotalCosts(projects, bookings);
 */
export const calculateCustomerTotalCosts = async (
  customerProjects: Project[],
  bookings: ExtendedBooking[]
): Promise<number> => {
  if (!customerProjects || customerProjects.length === 0) return 0;

  let totalCost = 0;

  // Sammle alle Material-IDs aus allen Projekten des Kunden
  const materialIds = new Set<string>();
  const projectBookingsMap: Record<string, ExtendedBooking[]> = {};

  customerProjects.forEach(project => {
    const projectBookings = bookings.filter(booking => booking.projectID === project.id);
    projectBookingsMap[project.id] = projectBookings;

    projectBookings.forEach(booking => {
      booking.materials?.forEach(material => {
        if (material.materialID) {
          materialIds.add(material.materialID);
        }
      });
    });
  });

  // Lade alle Materialien mit Preisen
  const materials: Record<string, Material> = {};
  try {
    const allMaterials = await FirebaseService.getDocuments('materials') as Material[];
    allMaterials.forEach(material => {
      if (materialIds.has(material.materialID)) {
        materials[material.materialID] = material;
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Materialien für Kundenkostenberechnung:', error);
    return 0;
  }

  // Berechne Gesamtkosten für alle Projekte des Kunden
  Object.values(projectBookingsMap).forEach(projectBookings => {
    projectBookings.forEach(booking => {
      booking.materials?.forEach(bookingMaterial => {
        const material = materials[bookingMaterial.materialID];
        if (material && material.price && bookingMaterial.quantity) {
          const price = Number(material.price);
          const quantity = Number(bookingMaterial.quantity);
          if (!isNaN(price) && !isNaN(quantity)) {
            totalCost += price * quantity;
          }
        }
      });
    });
  });

  return totalCost;
};

/**
 * Validiert das Kundenformular
 *
 * @param formData - Formulardaten
 * @param contactsCount - Anzahl der Ansprechpartner
 * @param isCreate - Ob es sich um Neuanlage handelt
 * @returns Validierungsfehler oder leeres Objekt
 *
 * @example
 * const errors = validateCustomerForm(formData, contacts.length, true);
 */
export const validateCustomerForm = (
  formData: CustomerFormData,
  contactsCount: number,
  isCreate: boolean
): CustomerFormErrors => {
  const errors: CustomerFormErrors = {};

  if (!formData.firmennameKundenname.trim()) {
    errors.firmennameKundenname = 'Firmenname/Kundenname ist erforderlich';
  }

  if (!formData.street.trim()) {
    errors.street = 'Straße ist erforderlich';
  }

  if (!formData.houseNumber.trim()) {
    errors.houseNumber = 'Hausnummer ist erforderlich';
  }

  if (!formData.postalCode.trim()) {
    errors.postalCode = 'PLZ ist erforderlich';
  } else if (!/^\d{5}$/.test(formData.postalCode.trim())) {
    errors.postalCode = 'PLZ muss 5 Ziffern haben';
  }

  if (!formData.city.trim()) {
    errors.city = 'Stadt ist erforderlich';
  }

  if (isCreate && contactsCount === 0) {
    errors.contacts = 'Mindestens ein Ansprechpartner ist erforderlich';
  }

  return errors;
};

/**
 * Prüft ob Validierungsfehler vorhanden sind
 *
 * @param errors - Validierungsfehler-Objekt
 * @returns true wenn Fehler vorhanden
 */
export const hasCustomerValidationErrors = (errors: CustomerFormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Speichert Spalteneinstellungen für Kundentabelle
 *
 * @param columns - Sichtbare Spalten
 */
export const saveCustomerColumnPreferences = async (
  columns: Record<string, boolean>
): Promise<void> => {
  try {
    const preferences = await FirebaseService.getDocuments('user-preferences');
    const existingPref = preferences.find((pref: any) => pref.type === 'customerColumns');

    const prefData = {
      type: 'customerColumns',
      columns: columns,
      updatedAt: new Date()
    };

    if (existingPref) {
      await FirebaseService.updateDocument('user-preferences', existingPref.id, prefData);
    } else {
      await FirebaseService.addDocument('user-preferences', {
        ...prefData,
        createdAt: new Date()
      });
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Spalteneinstellungen:', error);
    throw error;
  }
};

/**
 * Lädt Spalteneinstellungen für Kundentabelle
 *
 * @returns Gespeicherte Spalteneinstellungen oder null
 */
export const loadCustomerColumnPreferences = async (): Promise<Record<string, boolean> | null> => {
  try {
    const preferences = await FirebaseService.getDocuments('user-preferences');
    const columnPrefs = preferences.find((pref: any) => pref.type === 'customerColumns');

    if (columnPrefs && columnPrefs.columns) {
      return columnPrefs.columns;
    }
    return null;
  } catch (error) {
    console.error('Fehler beim Laden der Spalteneinstellungen:', error);
    return null;
  }
};

const CustomerService = {
  calculateCustomerTotalCosts,
  validateCustomerForm,
  hasCustomerValidationErrors,
  saveCustomerColumnPreferences,
  loadCustomerColumnPreferences
};

export default CustomerService;
