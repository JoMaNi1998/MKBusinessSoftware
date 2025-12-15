import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { OFFER_COLUMNS, DEFAULT_VISIBLE_COLUMNS } from '../shared';

/**
 * Hook für Offer-Spalten-Präferenzen
 * Speichert und lädt Einstellungen aus Firebase
 */
export const useOfferColumnPrefs = () => {
  const { user } = useAuth();
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [loading, setLoading] = useState(true);

  // Präferenzen laden
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const prefsDoc = await getDoc(doc(db, 'user-preferences', user.uid));
        if (prefsDoc.exists()) {
          const prefs = prefsDoc.data();
          if (prefs.offerColumns) {
            setVisibleColumns(prev => ({ ...prev, ...prefs.offerColumns }));
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Spalteneinstellungen:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  // Präferenzen speichern
  const savePreferences = useCallback(async (newColumns) => {
    if (!user?.uid) return;

    try {
      const prefsRef = doc(db, 'user-preferences', user.uid);
      const prefsDoc = await getDoc(prefsRef);
      const existingPrefs = prefsDoc.exists() ? prefsDoc.data() : {};
      await setDoc(prefsRef, {
        ...existingPrefs,
        offerColumns: newColumns
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Spalteneinstellungen:', error);
    }
  }, [user?.uid]);

  // Spalte umschalten
  const toggleColumn = useCallback((columnKey) => {
    const column = OFFER_COLUMNS.find(c => c.key === columnKey);
    if (column?.required) return;

    const newColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newColumns);
    savePreferences(newColumns);
  }, [visibleColumns, savePreferences]);

  return {
    visibleColumns,
    loading,
    toggleColumn,
    availableColumns: OFFER_COLUMNS
  };
};

export default useOfferColumnPrefs;
