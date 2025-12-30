/**
 * BOMCompletedService - Firebase Service für durchgestrichene Stücklisten-Positionen
 *
 * Verwaltet welche Materialien in der Monteur-Stückliste als "erledigt" markiert sind.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@config/firebase';

const COLLECTION_NAME = 'bom-completed-items';

export interface BOMCompletedItem {
  id: string;
  projectId: string;
  materialId: string;
  completedAt: string;
  completedBy: string;
}

/**
 * Generiert eine eindeutige ID für ein completed item
 */
const generateId = (projectId: string, materialId: string): string => {
  return `${projectId}_${materialId}`;
};

/**
 * Holt alle erledigten Items für ein Projekt
 */
export const getCompletedItems = async (projectId: string): Promise<BOMCompletedItem[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('projectId', '==', projectId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BOMCompletedItem));
  } catch (error) {
    console.error('Fehler beim Laden der erledigten Items:', error);
    return [];
  }
};

/**
 * Markiert ein Material als erledigt
 */
export const markAsCompleted = async (
  projectId: string,
  materialId: string,
  userId: string
): Promise<void> => {
  const id = generateId(projectId, materialId);
  const docRef = doc(db, COLLECTION_NAME, id);

  await setDoc(docRef, {
    projectId,
    materialId,
    completedAt: new Date().toISOString(),
    completedBy: userId
  });
};

/**
 * Entfernt die Erledigt-Markierung von einem Material
 */
export const markAsIncomplete = async (
  projectId: string,
  materialId: string
): Promise<void> => {
  const id = generateId(projectId, materialId);
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

/**
 * Toggle den Erledigt-Status eines Materials
 */
export const toggleCompleted = async (
  projectId: string,
  materialId: string,
  userId: string,
  isCurrentlyCompleted: boolean
): Promise<void> => {
  if (isCurrentlyCompleted) {
    await markAsIncomplete(projectId, materialId);
  } else {
    await markAsCompleted(projectId, materialId, userId);
  }
};

/**
 * Subscribes zu Änderungen an den erledigten Items eines Projekts
 */
export const subscribeToCompletedItems = (
  projectId: string,
  callback: (items: BOMCompletedItem[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('projectId', '==', projectId)
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BOMCompletedItem));
    callback(items);
  }, (error) => {
    console.error('Fehler beim Subscriben zu erledigten Items:', error);
    callback([]);
  });
};

export const BOMCompletedService = {
  getCompletedItems,
  markAsCompleted,
  markAsIncomplete,
  toggleCompleted,
  subscribeToCompletedItems
};
