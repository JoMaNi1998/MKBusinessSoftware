import React, { createContext, useContext, useCallback } from 'react';
import { OfferService } from '../services/firebaseService';
import { useCalculation } from './CalculationContext';
import { useAuth } from './AuthContext';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';

const OfferContext = createContext();

export const useOffers = () => {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error('useOffers must be used within an OfferProvider');
  }
  return context;
};

// Status-Optionen für Angebote
export const OFFER_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

export const OFFER_STATUS_LABELS = {
  draft: { label: 'Entwurf', color: 'gray', icon: 'Edit' },
  sent: { label: 'Gesendet', color: 'blue', icon: 'Send' },
  accepted: { label: 'Angenommen', color: 'green', icon: 'CheckCircle' },
  rejected: { label: 'Abgelehnt', color: 'red', icon: 'XCircle' },
  expired: { label: 'Abgelaufen', color: 'orange', icon: 'Clock' }
};

export const OfferProvider = ({ children }) => {
  // Firebase Real-time Listener mit Custom Hook
  const {
    data: offers,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener(OfferService.subscribeToOffers);

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  const { calculateOfferTotals, calculateValidUntil, settings: calcSettings } = useCalculation();
  const { user } = useAuth();

  // Neues Angebot erstellen
  const createOffer = useCallback(async (offerData) => {
    try {
      crud.setLoading(true);

      // Angebotsnummer generieren
      const offerNumber = await OfferService.getNextOfferNumber();

      // Summen berechnen
      const totals = calculateOfferTotals(offerData.items || [], offerData.discountPercent || 0);

      // Gültigkeitsdatum berechnen
      const validUntil = offerData.validUntil || calculateValidUntil();

      // Eindeutige ID basierend auf Angebotsnummer generieren
      const offerId = `offer-${offerNumber}-${Date.now()}`;

      const newOffer = {
        ...offerData,
        id: offerId,
        offerNumber,
        status: offerData.status || OFFER_STATUS.DRAFT,
        totals,
        conditions: {
          ...offerData.conditions,
          validUntil: offerData.conditions?.validUntil || validUntil,
          paymentTerms: offerData.conditions?.paymentTerms || calcSettings.offerDefaults?.paymentTerms || '',
          deliveryTerms: offerData.conditions?.deliveryTerms || calcSettings.offerDefaults?.deliveryTerms || '',
          notes: offerData.conditions?.notes || ''
        },
        version: 1,
        history: [{
          version: 1,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || 'system',
          changes: 'Erstellt'
        }],
        createdBy: user?.uid || 'system'
      };

      const result = await OfferService.addOffer(newOffer);
      return { success: true, offerId: result.id, offerNumber };
    } catch (err) {
      console.error('Error creating offer:', err);
      return { success: false, error: err.message };
    } finally {
      crud.setLoading(false);
    }
  }, [crud, calculateOfferTotals, calculateValidUntil, calcSettings, user]);

  // Angebot aktualisieren
  const updateOffer = useCallback(async (offerId, offerData, changeDescription = 'Aktualisiert') => {
    const existingOffer = offers.find(o => o.id === offerId);
    if (!existingOffer) {
      return { success: false, error: 'Angebot nicht gefunden' };
    }

    // Summen neu berechnen
    const totals = calculateOfferTotals(offerData.items || [], offerData.totals?.discountPercent || 0);

    // Version erhöhen und History aktualisieren
    const newVersion = (existingOffer.version || 1) + 1;
    const history = [
      ...(existingOffer.history || []),
      {
        version: newVersion,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || 'system',
        changes: changeDescription
      }
    ];

    const updatedOffer = {
      ...offerData,
      totals,
      version: newVersion,
      history
    };

    return crud.execute(OfferService.updateOffer, offerId, updatedOffer);
  }, [crud, offers, calculateOfferTotals, user]);

  // Angebot löschen
  const deleteOffer = useCallback(async (offerId) => {
    return crud.execute(OfferService.deleteOffer, offerId);
  }, [crud]);

  // Angebot duplizieren
  const duplicateOffer = useCallback(async (offerId) => {
    const originalOffer = offers.find(o => o.id === offerId);
    if (!originalOffer) {
      return { success: false, error: 'Angebot nicht gefunden' };
    }

    const { id, offerNumber, createdAt, updatedAt, history, version, status, ...offerData } = originalOffer;

    return createOffer({
      ...offerData,
      notes: `Kopie von ${offerNumber}\n${offerData.conditions?.notes || ''}`
    });
  }, [offers, createOffer]);

  // Status ändern
  const updateOfferStatus = useCallback(async (offerId, newStatus) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) {
      return { success: false, error: 'Angebot nicht gefunden' };
    }

    const statusData = {
      status: newStatus
    };

    // Zusätzliche Timestamps je nach Status
    if (newStatus === OFFER_STATUS.SENT) {
      statusData.sentAt = new Date().toISOString();
    } else if (newStatus === OFFER_STATUS.ACCEPTED) {
      statusData.acceptedAt = new Date().toISOString();
    } else if (newStatus === OFFER_STATUS.REJECTED) {
      statusData.rejectedAt = new Date().toISOString();
    }

    return crud.execute(OfferService.updateOffer, offerId, {
      ...offer,
      ...statusData,
      history: [
        ...(offer.history || []),
        {
          version: offer.version || 1,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || 'system',
          changes: `Status geändert: ${OFFER_STATUS_LABELS[newStatus]?.label}`
        }
      ]
    });
  }, [crud, offers, user]);

  // Position zu einem Angebot hinzufügen
  const addOfferItem = useCallback((offer, newItem) => {
    const items = [...(offer.items || [])];
    const newPosition = items.length + 1;

    const item = {
      ...newItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: newPosition,
      totalNet: (newItem.quantity || 1) * (newItem.unitPriceNet || 0) * (1 - (newItem.discount || 0) / 100)
    };

    items.push(item);
    return items;
  }, []);

  // Position aktualisieren
  const updateOfferItem = useCallback((offer, itemId, updates) => {
    const items = (offer.items || []).map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        updatedItem.totalNet = (updatedItem.quantity || 1) * (updatedItem.unitPriceNet || 0) * (1 - (updatedItem.discount || 0) / 100);
        return updatedItem;
      }
      return item;
    });
    return items;
  }, []);

  // Position entfernen
  const removeOfferItem = useCallback((offer, itemId) => {
    return (offer.items || [])
      .filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, position: index + 1 }));
  }, []);

  // Positionen neu sortieren
  const reorderOfferItems = useCallback((offer, fromIndex, toIndex) => {
    const items = [...(offer.items || [])];
    const [removed] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, removed);

    return items.map((item, index) => ({ ...item, position: index + 1 }));
  }, []);

  // Angebote nach Kunde
  const getOffersByCustomer = useCallback((customerId) => {
    return offers.filter(o => o.customerID === customerId);
  }, [offers]);

  // Angebote nach Projekt
  const getOffersByProject = useCallback((projectId) => {
    return offers.filter(o => o.projectID === projectId);
  }, [offers]);

  // Angebote nach Status
  const getOffersByStatus = useCallback((status) => {
    return offers.filter(o => o.status === status);
  }, [offers]);

  // Angebot nach ID
  const getOfferById = useCallback((offerId) => {
    return offers.find(o => o.id === offerId);
  }, [offers]);

  // Abgelaufene Angebote prüfen und Status aktualisieren
  const checkExpiredOffers = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    for (const offer of offers) {
      if (
        offer.status === OFFER_STATUS.SENT &&
        offer.conditions?.validUntil &&
        offer.conditions.validUntil < today
      ) {
        await updateOfferStatus(offer.id, OFFER_STATUS.EXPIRED);
      }
    }
  }, [offers, updateOfferStatus]);

  // Statistiken
  const getStatistics = useCallback(() => {
    const stats = {
      total: offers.length,
      byStatus: {},
      totalValue: 0,
      acceptedValue: 0
    };

    Object.keys(OFFER_STATUS).forEach(key => {
      stats.byStatus[OFFER_STATUS[key]] = offers.filter(o => o.status === OFFER_STATUS[key]).length;
    });

    offers.forEach(offer => {
      stats.totalValue += offer.totals?.grossTotal || 0;
      if (offer.status === OFFER_STATUS.ACCEPTED) {
        stats.acceptedValue += offer.totals?.grossTotal || 0;
      }
    });

    return stats;
  }, [offers]);

  const value = {
    offers,
    loading,
    error,
    createOffer,
    updateOffer,
    deleteOffer,
    duplicateOffer,
    updateOfferStatus,
    addOfferItem,
    updateOfferItem,
    removeOfferItem,
    reorderOfferItems,
    getOffersByCustomer,
    getOffersByProject,
    getOffersByStatus,
    getOfferById,
    checkExpiredOffers,
    getStatistics,
    OFFER_STATUS,
    OFFER_STATUS_LABELS
  };

  return (
    <OfferContext.Provider value={value}>
      {children}
    </OfferContext.Provider>
  );
};
