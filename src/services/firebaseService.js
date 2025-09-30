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
    .replace(/\#/g, '-HASH-')   // Hashtags ersetzen
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

// Collection Namen
export const COLLECTIONS = {
  MATERIALS: 'materials',
  CUSTOMERS: 'customers',
  BOOKINGS: 'bookings',
  PROJECTS: 'projects'
};

// Generic CRUD Operations
export class FirebaseService {
  
  // CREATE - Dokument hinzufügen
  static async addDocument(collectionName, data) {
    try {
      // Verwende die originale ID als Firestore Document ID (bereinigt)
      const sanitizedId = sanitizeDocumentId(data.id || data.materialID || data.customerID);
      
      const docData = {
        ...data,
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
      return onSnapshot(q, (querySnapshot) => {
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(documents);
      });
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
      await updateDoc(docRef, {
        ...data,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static async updateProject(projectId, projectData) {
    return FirebaseService.updateDocument(COLLECTIONS.PROJECTS, projectId, {
      ...projectData,
      updatedAt: new Date().toISOString()
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
