import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  WhereFilterOp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CounterService } from './CounterService';
import type {
  Material,
  Customer,
  Booking,
  Project,
  CalculationSettings,
  CompanySettings,
  ServiceCatalogItem,
  Offer,
  Invoice,
  ServiceResult
} from '../types';

// ID-Bereinigung für Firestore (entfernt problematische Zeichen)
export const sanitizeDocumentId = (id: string | null | undefined): string => {
  if (!id) return id as string;
  return id.toString()
    .replace(/\//g, '-SLASH-')  // Schrägstriche ersetzen
    .replace(/\./g, '-DOT-')    // Punkte ersetzen
    .replace(/#/g, '-HASH-')   // Hashtags ersetzen
    .replace(/\[/g, '-LBRACKET-') // Eckige Klammern ersetzen
    .replace(/\]/g, '-RBRACKET-')
    .replace(/\$/g, '-DOLLAR-'); // Dollar-Zeichen ersetzen
};

// ID-Wiederherstellung (für Anzeige)
export const unsanitizeDocumentId = (id: string | null | undefined): string => {
  if (!id) return id as string;
  return id.toString()
    .replace(/-SLASH-/g, '/')
    .replace(/-DOT-/g, '.')
    .replace(/-HASH-/g, '#')
    .replace(/-LBRACKET-/g, '[')
    .replace(/-RBRACKET-/g, ']')
    .replace(/-DOLLAR-/g, '$');
};

// Entfernt undefined-Werte aus einem Objekt (rekursiv)
// Firebase akzeptiert keine undefined-Werte
export const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)).filter(item => item !== undefined);
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
};

// Collection Namen
export const COLLECTIONS = {
  MATERIALS: 'materials',
  CUSTOMERS: 'customers',
  BOOKINGS: 'bookings',
  PROJECTS: 'projects',
  CALCULATION_SETTINGS: 'calculation-settings',
  COMPANY_SETTINGS: 'company-settings',
  SERVICE_CATALOG: 'service-catalog',
  OFFERS: 'offers',
  OFFER_TEMPLATES: 'offer-templates',
  INVOICES: 'invoices',
  PV_CONFIGURATIONS: 'pv-configurations'
} as const;

// Generic CRUD Operations
export class FirebaseService {

  // CREATE - Dokument hinzufügen
  static async addDocument<T = any>(collectionName: string, data: any): Promise<T> {
    try {
      // Verwende die originale ID als Firestore Document ID (bereinigt)
      const sanitizedId = sanitizeDocumentId(data.id || data.materialID || data.customerID);

      // Undefined-Werte entfernen (Firebase akzeptiert diese nicht)
      const cleanedData = removeUndefined(data);

      const docData: any = {
        ...cleanedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Nur originalId hinzufügen, wenn eine ID vorhanden ist
      const originalId = data.id || data.materialID || data.customerID;
      if (originalId) {
        docData.originalId = originalId;
      }

      if (sanitizedId) {
        // Verwende die bereinigte ID als Document ID
        await setDoc(doc(db, collectionName, sanitizedId), docData);
        return { id: sanitizedId, ...docData } as T;
      } else {
        // Fallback: Auto-generierte ID
        const docRef = await addDoc(collection(db, collectionName), docData);
        return { id: docRef.id, ...docData } as T;
      }
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  // READ - Einzelnes Dokument
  static async getDocument<T = any>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const sanitizedId = sanitizeDocumentId(docId);
      const docRef = doc(db, collectionName, sanitizedId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
      } else {
        console.log(`No document found with ID: ${docId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error getting document ${docId} from ${collectionName}:`, error);
      throw error;
    }
  }

  // READ - Alle Dokumente einer Collection
  static async getDocuments<T = any>(collectionName: string, orderByField: string = 'createdAt'): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), orderBy(orderByField, 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // READ - Real-time Listener für Collection
  static subscribeToCollection<T = any>(
    collectionName: string,
    callback: (documents: T[]) => void,
    orderByField: string = 'createdAt'
  ): () => void {
    try {
      const q = query(collection(db, collectionName), orderBy(orderByField, 'desc'));
      return onSnapshot(q,
        (querySnapshot) => {
          const documents = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          callback(documents);
        },
        (error) => {
          console.error(`Error in real-time listener for ${collectionName}:`, error);
        }
      );
    } catch (error) {
      console.error(`Error subscribing to ${collectionName}:`, error);
      throw error;
    }
  }

  // UPDATE - Dokument aktualisieren
  static async updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
    try {
      if (!docId) {
        throw new Error(`Document ID is required for updating ${collectionName}`);
      }
      const sanitizedId = sanitizeDocumentId(docId);
      const docRef = doc(db, collectionName, sanitizedId);

      // Undefined-Werte entfernen (Firebase akzeptiert diese nicht)
      const cleanedData = removeUndefined(data);

      await updateDoc(docRef, {
        ...cleanedData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // DELETE - Dokument löschen
  static async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const sanitizedId = sanitizeDocumentId(docId);
      console.log(`Deleting document: ${collectionName}/${sanitizedId}`);
      await deleteDoc(doc(db, collectionName, sanitizedId));
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // QUERY - Dokumente mit Bedingung
  static async queryDocuments<T = any>(
    collectionName: string,
    field: string,
    operator: WhereFilterOp,
    value: any
  ): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error querying documents from ${collectionName}:`, error);
      throw error;
    }
  }
}

// Spezifische Service-Funktionen für Materialien
export class MaterialService {
  static async getAllMaterials(): Promise<Material[]> {
    return FirebaseService.getDocuments<Material>(COLLECTIONS.MATERIALS, 'materialID');
  }

  static async getDocument(materialId: string): Promise<Material | null> {
    return FirebaseService.getDocument<Material>(COLLECTIONS.MATERIALS, materialId);
  }

  static async addMaterial(materialData: any): Promise<Material> {
    return FirebaseService.addDocument<Material>(COLLECTIONS.MATERIALS, materialData);
  }

  static async updateMaterial(materialId: string, materialData: any): Promise<void> {
    return FirebaseService.updateDocument(COLLECTIONS.MATERIALS, materialId, materialData);
  }

  static async deleteMaterial(materialId: string): Promise<void> {
    return FirebaseService.deleteDocument(COLLECTIONS.MATERIALS, materialId);
  }

  static subscribeToMaterials(callback: (materials: Material[]) => void): () => void {
    return FirebaseService.subscribeToCollection<Material>(COLLECTIONS.MATERIALS, callback, 'materialID');
  }
}

// Spezifische Service-Funktionen für Kunden
export class CustomerService {
  static async getAllCustomers(): Promise<Customer[]> {
    return FirebaseService.getDocuments<Customer>(COLLECTIONS.CUSTOMERS, 'firmennameKundenname');
  }

  static async addCustomer(customerData: any): Promise<Customer> {
    return FirebaseService.addDocument<Customer>(COLLECTIONS.CUSTOMERS, customerData);
  }

  static async updateCustomer(customerId: string, customerData: any): Promise<void> {
    return FirebaseService.updateDocument(COLLECTIONS.CUSTOMERS, customerId, customerData);
  }

  static async deleteCustomer(customerId: string): Promise<void> {
    return FirebaseService.deleteDocument(COLLECTIONS.CUSTOMERS, customerId);
  }

  static subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    return FirebaseService.subscribeToCollection<Customer>(COLLECTIONS.CUSTOMERS, callback, 'firmennameKundenname');
  }
}

// Spezifische Service-Funktionen für Buchungen
export class BookingService {
  static async getAllBookings(): Promise<Booking[]> {
    return FirebaseService.getDocuments<Booking>(COLLECTIONS.BOOKINGS, 'date');
  }

  static async addBooking(bookingData: any): Promise<Booking> {
    return FirebaseService.addDocument<Booking>(COLLECTIONS.BOOKINGS, {
      ...bookingData,
      date: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
  }

  static async updateBooking(bookingId: string, bookingData: any): Promise<void> {
    return FirebaseService.updateDocument(COLLECTIONS.BOOKINGS, bookingId, bookingData);
  }

  static async deleteBooking(bookingId: string): Promise<void> {
    return FirebaseService.deleteDocument(COLLECTIONS.BOOKINGS, bookingId);
  }

  static subscribeToBookings(callback: (bookings: Booking[]) => void): () => void {
    return FirebaseService.subscribeToCollection<Booking>(COLLECTIONS.BOOKINGS, callback, 'date');
  }

  static async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    return FirebaseService.queryDocuments<Booking>(COLLECTIONS.BOOKINGS, 'customerID', '==', customerId);
  }
}

// Project Service
export class ProjectService {
  static async addProject(projectData: any): Promise<Project> {
    return FirebaseService.addDocument<Project>(COLLECTIONS.PROJECTS, {
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  static async updateProject(projectId: string, projectData: any): Promise<void> {
    return FirebaseService.updateDocument(COLLECTIONS.PROJECTS, projectId, {
      ...projectData,
      updatedAt: serverTimestamp()
    });
  }

  static async deleteProject(projectId: string): Promise<void> {
    return FirebaseService.deleteDocument(COLLECTIONS.PROJECTS, projectId);
  }

  static subscribeToProjects(callback: (projects: Project[]) => void): () => void {
    return FirebaseService.subscribeToCollection<Project>(COLLECTIONS.PROJECTS, callback, 'createdAt');
  }

  static async getProjectsByCustomer(customerId: string): Promise<Project[]> {
    return FirebaseService.queryDocuments<Project>(COLLECTIONS.PROJECTS, 'customerID', '==', customerId);
  }

  static async getDocument(projectId: string): Promise<Project | null> {
    return FirebaseService.getDocument<Project>(COLLECTIONS.PROJECTS, projectId);
  }
}

// Calculation Settings Service
export class CalculationSettingsService {
  static async getSettings(): Promise<CalculationSettings | null> {
    try {
      const settings = await FirebaseService.getDocument<CalculationSettings>(COLLECTIONS.CALCULATION_SETTINGS, 'default');
      return settings;
    } catch (error) {
      console.error('Error getting calculation settings:', error);
      return null;
    }
  }

  static async saveSettings(settingsData: Partial<CalculationSettings>): Promise<ServiceResult> {
    try {
      const existingSettings = await this.getSettings();
      if (existingSettings) {
        await FirebaseService.updateDocument(COLLECTIONS.CALCULATION_SETTINGS, 'default', settingsData);
      } else {
        await setDoc(doc(db, COLLECTIONS.CALCULATION_SETTINGS, 'default'), {
          ...settingsData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return { success: true };
    } catch (error) {
      console.error('Error saving calculation settings:', error);
      throw error;
    }
  }

  static subscribeToSettings(callback: (settings: CalculationSettings | null) => void): () => void {
    const docRef = doc(db, COLLECTIONS.CALCULATION_SETTINGS, 'default');
    return onSnapshot(docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() } as CalculationSettings);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in settings listener:', error);
        callback(null);
      }
    );
  }
}

// Company Settings Service (Firmendaten & Texte)
export class CompanySettingsService {
  static async getSettings(): Promise<CompanySettings | null> {
    try {
      const settings = await FirebaseService.getDocument<CompanySettings>(COLLECTIONS.COMPANY_SETTINGS, 'default');
      return settings;
    } catch (error) {
      console.error('Error getting company settings:', error);
      return null;
    }
  }

  static async saveSettings(settingsData: Partial<CompanySettings>): Promise<ServiceResult> {
    try {
      const existingSettings = await this.getSettings();
      if (existingSettings) {
        await FirebaseService.updateDocument(COLLECTIONS.COMPANY_SETTINGS, 'default', settingsData);
      } else {
        await setDoc(doc(db, COLLECTIONS.COMPANY_SETTINGS, 'default'), {
          ...settingsData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return { success: true };
    } catch (error) {
      console.error('Error saving company settings:', error);
      throw error;
    }
  }

  static subscribeToSettings(callback: (settings: CompanySettings | null) => void): () => void {
    const docRef = doc(db, COLLECTIONS.COMPANY_SETTINGS, 'default');
    return onSnapshot(docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() } as CompanySettings);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in company settings listener:', error);
        callback(null);
      }
    );
  }
}

// Service Catalog Service (Leistungskatalog)
export class ServiceCatalogService {
  static async getAllServices(): Promise<ServiceCatalogItem[]> {
    return FirebaseService.getDocuments<ServiceCatalogItem>(COLLECTIONS.SERVICE_CATALOG, 'sortOrder');
  }

  static async getService(serviceId: string): Promise<ServiceCatalogItem | null> {
    return FirebaseService.getDocument<ServiceCatalogItem>(COLLECTIONS.SERVICE_CATALOG, serviceId);
  }

  static async addService(serviceData: any): Promise<ServiceCatalogItem> {
    return FirebaseService.addDocument<ServiceCatalogItem>(COLLECTIONS.SERVICE_CATALOG, serviceData);
  }

  static async updateService(serviceId: string, serviceData: any): Promise<void> {
    return FirebaseService.updateDocument(COLLECTIONS.SERVICE_CATALOG, serviceId, serviceData);
  }

  static async deleteService(serviceId: string): Promise<void> {
    return FirebaseService.deleteDocument(COLLECTIONS.SERVICE_CATALOG, serviceId);
  }

  static subscribeToServices(callback: (services: ServiceCatalogItem[]) => void): () => void {
    // Einfache Query ohne composite index (sortiert nur nach sortOrder)
    return FirebaseService.subscribeToCollection<ServiceCatalogItem>(COLLECTIONS.SERVICE_CATALOG, callback, 'sortOrder');
  }

  static async getServicesByCategory(category: string): Promise<ServiceCatalogItem[]> {
    return FirebaseService.queryDocuments<ServiceCatalogItem>(COLLECTIONS.SERVICE_CATALOG, 'category', '==', category);
  }
}

// Offer Service (Angebote)
export class OfferService {
  static async getAllOffers(): Promise<Offer[]> {
    return FirebaseService.getDocuments<Offer>(COLLECTIONS.OFFERS, 'createdAt');
  }

  static async getOffer(offerId: string): Promise<Offer | null> {
    return FirebaseService.getDocument<Offer>(COLLECTIONS.OFFERS, offerId);
  }

  static async addOffer(offerData: any): Promise<Offer> {
    return FirebaseService.addDocument<Offer>(COLLECTIONS.OFFERS, offerData);
  }

  static async updateOffer(offerId: string, offerData: any): Promise<void> {
    return FirebaseService.updateDocument(COLLECTIONS.OFFERS, offerId, offerData);
  }

  static async deleteOffer(offerId: string): Promise<void> {
    return FirebaseService.deleteDocument(COLLECTIONS.OFFERS, offerId);
  }

  static subscribeToOffers(callback: (offers: Offer[]) => void): () => void {
    return FirebaseService.subscribeToCollection<Offer>(COLLECTIONS.OFFERS, callback, 'createdAt');
  }

  static async getOffersByCustomer(customerId: string): Promise<Offer[]> {
    return FirebaseService.queryDocuments<Offer>(COLLECTIONS.OFFERS, 'customerID', '==', customerId);
  }

  static async getOffersByProject(projectId: string): Promise<Offer[]> {
    return FirebaseService.queryDocuments<Offer>(COLLECTIONS.OFFERS, 'projectID', '==', projectId);
  }

  static async getOffersByStatus(status: string): Promise<Offer[]> {
    return FirebaseService.queryDocuments<Offer>(COLLECTIONS.OFFERS, 'status', '==', status);
  }

  static async getNextOfferNumber(): Promise<string> {
    // Verwendet CounterService für atomare, race-condition-sichere Nummern-Generierung
    return CounterService.getNextNumber('offers', 'ANG');
  }
}

// Invoice Service
export class InvoiceService {
  static async getAllInvoices(): Promise<Invoice[]> {
    return FirebaseService.getDocuments<Invoice>(COLLECTIONS.INVOICES, 'createdAt');
  }

  static async getInvoice(invoiceId: string): Promise<Invoice | null> {
    return FirebaseService.getDocument<Invoice>(COLLECTIONS.INVOICES, invoiceId);
  }

  static async addInvoice(invoiceData: any): Promise<Invoice> {
    return FirebaseService.addDocument<Invoice>(COLLECTIONS.INVOICES, invoiceData);
  }

  static async updateInvoice(invoiceId: string, invoiceData: any): Promise<void> {
    return FirebaseService.updateDocument(COLLECTIONS.INVOICES, invoiceId, invoiceData);
  }

  static async deleteInvoice(invoiceId: string): Promise<void> {
    return FirebaseService.deleteDocument(COLLECTIONS.INVOICES, invoiceId);
  }

  static subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void {
    return FirebaseService.subscribeToCollection<Invoice>(COLLECTIONS.INVOICES, callback, 'createdAt');
  }

  static async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    return FirebaseService.queryDocuments<Invoice>(COLLECTIONS.INVOICES, 'customerID', '==', customerId);
  }

  static async getInvoicesByOffer(offerId: string): Promise<Invoice[]> {
    return FirebaseService.queryDocuments<Invoice>(COLLECTIONS.INVOICES, 'offerID', '==', offerId);
  }

  static async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    return FirebaseService.queryDocuments<Invoice>(COLLECTIONS.INVOICES, 'status', '==', status);
  }

  static async getNextInvoiceNumber(): Promise<string> {
    // Verwendet CounterService für atomare, race-condition-sichere Nummern-Generierung
    return CounterService.getNextNumber('invoices', 'RE');
  }
}

// PV Configurator Service
export class ConfiguratorService {
  static async getAllConfigurations(): Promise<any[]> {
    return FirebaseService.getDocuments(COLLECTIONS.PV_CONFIGURATIONS, 'createdAt');
  }

  static async getConfiguration(configId: string): Promise<any | null> {
    return FirebaseService.getDocument(COLLECTIONS.PV_CONFIGURATIONS, configId);
  }

  static async addConfiguration(configData: any): Promise<any> {
    return FirebaseService.addDocument(COLLECTIONS.PV_CONFIGURATIONS, configData);
  }

  static async updateConfiguration(configId: string, configData: any): Promise<void> {
    return FirebaseService.updateDocument(COLLECTIONS.PV_CONFIGURATIONS, configId, configData);
  }

  static async deleteConfiguration(configId: string): Promise<void> {
    return FirebaseService.deleteDocument(COLLECTIONS.PV_CONFIGURATIONS, configId);
  }

  static subscribeToConfigurations(callback: (configs: any[]) => void): () => void {
    return FirebaseService.subscribeToCollection(COLLECTIONS.PV_CONFIGURATIONS, callback, 'createdAt');
  }

  static async getConfigurationsByCustomer(customerId: string): Promise<any[]> {
    return FirebaseService.queryDocuments(COLLECTIONS.PV_CONFIGURATIONS, 'customerID', '==', customerId);
  }

  static async getConfigurationsByProject(projectId: string): Promise<any[]> {
    return FirebaseService.queryDocuments(COLLECTIONS.PV_CONFIGURATIONS, 'projectID', '==', projectId);
  }

  static async getConfigurationsByStatus(status: string): Promise<any[]> {
    return FirebaseService.queryDocuments(COLLECTIONS.PV_CONFIGURATIONS, 'status', '==', status);
  }

  static async getNextConfigNumber(): Promise<string> {
    // Verwendet CounterService für atomare, race-condition-sichere Nummern-Generierung
    return CounterService.getNextNumber('configurations', 'KONF');
  }
}
