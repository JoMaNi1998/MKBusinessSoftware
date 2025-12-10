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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ID-Bereinigung für Firestore (entfernt problematische Zeichen)
export const sanitizeDocumentId = (id) => {
  if (!id) return id;
  return id.toString()
    .replace(/\//g, '-SLASH-')  // Schrägstriche ersetzen
    .replace(/\./g, '-DOT-')    // Punkte ersetzen
    .replace(/#/g, '-HASH-')   // Hashtags ersetzen
    .replace(/\[/g, '-LBRACKET-') // Eckige Klammern ersetzen
    .replace(/\]/g, '-RBRACKET-')
    .replace(/\$/g, '-DOLLAR-'); // Dollar-Zeichen ersetzen
};

// ID-Wiederherstellung (für Anzeige)
export const unsanitizeDocumentId = (id) => {
  if (!id) return id;
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
export const removeUndefined = (obj) => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)).filter(item => item !== undefined);
  }
  if (typeof obj === 'object') {
    const cleaned = {};
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
  INVOICES: 'invoices'
};

// Generic CRUD Operations
export class FirebaseService {
  
  // CREATE - Dokument hinzufügen
  static async addDocument(collectionName, data) {
    try {
      // Verwende die originale ID als Firestore Document ID (bereinigt)
      const sanitizedId = sanitizeDocumentId(data.id || data.materialID || data.customerID);

      // Undefined-Werte entfernen (Firebase akzeptiert diese nicht)
      const cleanedData = removeUndefined(data);

      const docData = {
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
        return { id: sanitizedId, ...docData };
      } else {
        // Fallback: Auto-generierte ID
        const docRef = await addDoc(collection(db, collectionName), docData);
        return { id: docRef.id, ...docData };
      }
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  // READ - Einzelnes Dokument
  static async getDocument(collectionName, docId) {
    try {
      const sanitizedId = sanitizeDocumentId(docId);
      const docRef = doc(db, collectionName, sanitizedId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
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
  static async getDocuments(collectionName, orderByField = 'createdAt') {
    try {
      const q = query(collection(db, collectionName), orderBy(orderByField, 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // READ - Real-time Listener für Collection
  static subscribeToCollection(collectionName, callback, orderByField = 'createdAt') {
    try {
      const q = query(collection(db, collectionName), orderBy(orderByField, 'desc'));
      return onSnapshot(q,
        (querySnapshot) => {
          const documents = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
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
  static async updateDocument(collectionName, docId, data) {
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
  static async deleteDocument(collectionName, docId) {
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
  static async queryDocuments(collectionName, field, operator, value) {
    try {
      const q = query(collection(db, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error querying documents from ${collectionName}:`, error);
      throw error;
    }
  }
}

// Spezifische Service-Funktionen für Materialien
export class MaterialService {
  static async getAllMaterials() {
    return FirebaseService.getDocuments(COLLECTIONS.MATERIALS, 'materialID');
  }

  static async getDocument(materialId) {
    return FirebaseService.getDocument(COLLECTIONS.MATERIALS, materialId);
  }

  static async addMaterial(materialData) {
    return FirebaseService.addDocument(COLLECTIONS.MATERIALS, materialData);
  }

  static async updateMaterial(materialId, materialData) {
    return FirebaseService.updateDocument(COLLECTIONS.MATERIALS, materialId, materialData);
  }

  static async deleteMaterial(materialId) {
    return FirebaseService.deleteDocument(COLLECTIONS.MATERIALS, materialId);
  }

  static subscribeToMaterials(callback) {
    return FirebaseService.subscribeToCollection(COLLECTIONS.MATERIALS, callback, 'materialID');
  }
}

// Spezifische Service-Funktionen für Kunden
export class CustomerService {
  static async getAllCustomers() {
    return FirebaseService.getDocuments(COLLECTIONS.CUSTOMERS, 'firmennameKundenname');
  }

  static async addCustomer(customerData) {
    return FirebaseService.addDocument(COLLECTIONS.CUSTOMERS, customerData);
  }

  static async updateCustomer(customerId, customerData) {
    return FirebaseService.updateDocument(COLLECTIONS.CUSTOMERS, customerId, customerData);
  }

  static async deleteCustomer(customerId) {
    return FirebaseService.deleteDocument(COLLECTIONS.CUSTOMERS, customerId);
  }

  static subscribeToCustomers(callback) {
    return FirebaseService.subscribeToCollection(COLLECTIONS.CUSTOMERS, callback, 'firmennameKundenname');
  }
}

// Spezifische Service-Funktionen für Buchungen
export class BookingService {
  static async getAllBookings() {
    return FirebaseService.getDocuments(COLLECTIONS.BOOKINGS, 'date');
  }

  static async addBooking(bookingData) {
    return FirebaseService.addDocument(COLLECTIONS.BOOKINGS, {
      ...bookingData,
      date: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
  }

  static async updateBooking(bookingId, bookingData) {
    return FirebaseService.updateDocument(COLLECTIONS.BOOKINGS, bookingId, bookingData);
  }

  static async deleteBooking(bookingId) {
    return FirebaseService.deleteDocument(COLLECTIONS.BOOKINGS, bookingId);
  }

  static subscribeToBookings(callback) {
    return FirebaseService.subscribeToCollection(COLLECTIONS.BOOKINGS, callback, 'date');
  }

  static async getBookingsByCustomer(customerId) {
    return FirebaseService.queryDocuments(COLLECTIONS.BOOKINGS, 'customerID', '==', customerId);
  }
}

// Project Service
export class ProjectService {
  static async addProject(projectData) {
    return FirebaseService.addDocument(COLLECTIONS.PROJECTS, {
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  static async updateProject(projectId, projectData) {
    return FirebaseService.updateDocument(COLLECTIONS.PROJECTS, projectId, {
      ...projectData,
      updatedAt: serverTimestamp()
    });
  }

  static async deleteProject(projectId) {
    return FirebaseService.deleteDocument(COLLECTIONS.PROJECTS, projectId);
  }

  static subscribeToProjects(callback) {
    return FirebaseService.subscribeToCollection(COLLECTIONS.PROJECTS, callback, 'createdAt');
  }

  static async getProjectsByCustomer(customerId) {
    return FirebaseService.queryDocuments(COLLECTIONS.PROJECTS, 'customerID', '==', customerId);
  }

  static async getDocument(projectId) {
    return FirebaseService.getDocument(COLLECTIONS.PROJECTS, projectId);
  }
}

// Calculation Settings Service
export class CalculationSettingsService {
  static async getSettings() {
    try {
      const settings = await FirebaseService.getDocument(COLLECTIONS.CALCULATION_SETTINGS, 'default');
      return settings;
    } catch (error) {
      console.error('Error getting calculation settings:', error);
      return null;
    }
  }

  static async saveSettings(settingsData) {
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

  static subscribeToSettings(callback) {
    const docRef = doc(db, COLLECTIONS.CALCULATION_SETTINGS, 'default');
    return onSnapshot(docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() });
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
  static async getSettings() {
    try {
      const settings = await FirebaseService.getDocument(COLLECTIONS.COMPANY_SETTINGS, 'default');
      return settings;
    } catch (error) {
      console.error('Error getting company settings:', error);
      return null;
    }
  }

  static async saveSettings(settingsData) {
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

  static subscribeToSettings(callback) {
    const docRef = doc(db, COLLECTIONS.COMPANY_SETTINGS, 'default');
    return onSnapshot(docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() });
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
  static async getAllServices() {
    return FirebaseService.getDocuments(COLLECTIONS.SERVICE_CATALOG, 'sortOrder');
  }

  static async getService(serviceId) {
    return FirebaseService.getDocument(COLLECTIONS.SERVICE_CATALOG, serviceId);
  }

  static async addService(serviceData) {
    return FirebaseService.addDocument(COLLECTIONS.SERVICE_CATALOG, serviceData);
  }

  static async updateService(serviceId, serviceData) {
    return FirebaseService.updateDocument(COLLECTIONS.SERVICE_CATALOG, serviceId, serviceData);
  }

  static async deleteService(serviceId) {
    return FirebaseService.deleteDocument(COLLECTIONS.SERVICE_CATALOG, serviceId);
  }

  static subscribeToServices(callback) {
    // Einfache Query ohne composite index (sortiert nur nach sortOrder)
    return FirebaseService.subscribeToCollection(COLLECTIONS.SERVICE_CATALOG, callback, 'sortOrder');
  }

  static async getServicesByCategory(category) {
    return FirebaseService.queryDocuments(COLLECTIONS.SERVICE_CATALOG, 'category', '==', category);
  }
}

// Offer Service (Angebote)
export class OfferService {
  static async getAllOffers() {
    return FirebaseService.getDocuments(COLLECTIONS.OFFERS, 'createdAt');
  }

  static async getOffer(offerId) {
    return FirebaseService.getDocument(COLLECTIONS.OFFERS, offerId);
  }

  static async addOffer(offerData) {
    return FirebaseService.addDocument(COLLECTIONS.OFFERS, offerData);
  }

  static async updateOffer(offerId, offerData) {
    return FirebaseService.updateDocument(COLLECTIONS.OFFERS, offerId, offerData);
  }

  static async deleteOffer(offerId) {
    return FirebaseService.deleteDocument(COLLECTIONS.OFFERS, offerId);
  }

  static subscribeToOffers(callback) {
    return FirebaseService.subscribeToCollection(COLLECTIONS.OFFERS, callback, 'createdAt');
  }

  static async getOffersByCustomer(customerId) {
    return FirebaseService.queryDocuments(COLLECTIONS.OFFERS, 'customerID', '==', customerId);
  }

  static async getOffersByProject(projectId) {
    return FirebaseService.queryDocuments(COLLECTIONS.OFFERS, 'projectID', '==', projectId);
  }

  static async getOffersByStatus(status) {
    return FirebaseService.queryDocuments(COLLECTIONS.OFFERS, 'status', '==', status);
  }

  static async getNextOfferNumber() {
    try {
      const currentYear = new Date().getFullYear();
      const offers = await this.getAllOffers();

      // Filter offers from current year and find highest number
      const yearOffers = offers.filter(o => {
        const offerYear = o.offerNumber?.match(/\d{4}/)?.[0];
        return offerYear === String(currentYear);
      });

      let maxNumber = 0;
      yearOffers.forEach(o => {
        const match = o.offerNumber?.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      });

      const nextNumber = String(maxNumber + 1).padStart(4, '0');
      return `ANG-${currentYear}-${nextNumber}`;
    } catch (error) {
      console.error('Error generating offer number:', error);
      const timestamp = Date.now();
      return `ANG-${new Date().getFullYear()}-${timestamp}`;
    }
  }
}

// Invoice Service
export class InvoiceService {
  static async getAllInvoices() {
    return FirebaseService.getDocuments(COLLECTIONS.INVOICES, 'createdAt');
  }

  static async getInvoice(invoiceId) {
    return FirebaseService.getDocument(COLLECTIONS.INVOICES, invoiceId);
  }

  static async addInvoice(invoiceData) {
    return FirebaseService.addDocument(COLLECTIONS.INVOICES, invoiceData);
  }

  static async updateInvoice(invoiceId, invoiceData) {
    return FirebaseService.updateDocument(COLLECTIONS.INVOICES, invoiceId, invoiceData);
  }

  static async deleteInvoice(invoiceId) {
    return FirebaseService.deleteDocument(COLLECTIONS.INVOICES, invoiceId);
  }

  static subscribeToInvoices(callback) {
    return FirebaseService.subscribeToCollection(COLLECTIONS.INVOICES, callback, 'createdAt');
  }

  static async getInvoicesByCustomer(customerId) {
    return FirebaseService.queryDocuments(COLLECTIONS.INVOICES, 'customerID', '==', customerId);
  }

  static async getInvoicesByOffer(offerId) {
    return FirebaseService.queryDocuments(COLLECTIONS.INVOICES, 'offerID', '==', offerId);
  }

  static async getInvoicesByStatus(status) {
    return FirebaseService.queryDocuments(COLLECTIONS.INVOICES, 'status', '==', status);
  }

  static async getNextInvoiceNumber() {
    try {
      const currentYear = new Date().getFullYear();
      const invoices = await this.getAllInvoices();

      // Filter invoices from current year and find highest number
      const yearInvoices = invoices.filter(i => {
        const invoiceYear = i.invoiceNumber?.match(/\d{4}/)?.[0];
        return invoiceYear === String(currentYear);
      });

      let maxNumber = 0;
      yearInvoices.forEach(i => {
        const match = i.invoiceNumber?.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      });

      const nextNumber = String(maxNumber + 1).padStart(4, '0');
      return `RE-${currentYear}-${nextNumber}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      const timestamp = Date.now();
      return `RE-${new Date().getFullYear()}-${timestamp}`;
    }
  }
}
