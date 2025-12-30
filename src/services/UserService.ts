import { FirebaseService } from './firebaseService';

const COLLECTION = 'users';

/**
 * User - Benutzer aus Firestore
 */
export interface FirestoreUser {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
  permissions?: string[];
  createdAt?: Date;
}

/**
 * UserService - Verwaltet Benutzer-Daten
 */
export class UserService {
  /**
   * Alle Benutzer laden
   */
  static async getAllUsers(): Promise<FirestoreUser[]> {
    try {
      const users = await FirebaseService.getDocuments(COLLECTION);
      return users as FirestoreUser[];
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
      throw error;
    }
  }

  /**
   * Benutzer mit bestimmter Rolle laden
   */
  static async getUsersByRole(role: string): Promise<FirestoreUser[]> {
    try {
      const users = await FirebaseService.queryDocuments(
        COLLECTION,
        'role',
        '==',
        role
      );
      return users as FirestoreUser[];
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer nach Rolle:', error);
      throw error;
    }
  }

  /**
   * Alle Monteure laden (Rolle = 'monteur')
   */
  static async getMonteure(): Promise<FirestoreUser[]> {
    return this.getUsersByRole('monteur');
  }

  /**
   * Benutzer nach ID laden
   */
  static async getUserById(userId: string): Promise<FirestoreUser | null> {
    try {
      const user = await FirebaseService.getDocument(COLLECTION, userId);
      return user as FirestoreUser | null;
    } catch (error) {
      console.error('Fehler beim Laden des Benutzers:', error);
      throw error;
    }
  }
}
