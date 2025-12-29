import React, { createContext, useContext, useCallback } from 'react';
import { OfferService } from '../services/firebaseService';
import { useCalculation } from './CalculationContext';
import { useAuth } from './AuthContext';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';
import type {
  OfferContextValue,
  ExtendedOfferItem,
  OfferStatistics
} from '../types/contexts/offer.types';
import type { Offer, OfferStatus, OfferStatusConfig, OfferHistoryEntry } from '../types';
import { OfferStatus as OfferStatusEnum } from '../types/enums';

const OfferContext = createContext<OfferContextValue | undefined>(undefined);

export const useOffers = (): OfferContextValue => {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error('useOffers must be used within an OfferProvider');
  }
  return context;
};

// Export enum for backward compatibility
export const OFFER_STATUS = OfferStatusEnum;

// Status-Labels
export const OFFER_STATUS_LABELS: Record<OfferStatus, OfferStatusConfig> = {
  draft: { label: 'Entwurf', color: 'gray', icon: 'Edit' },
  sent: { label: 'Gesendet', color: 'blue', icon: 'Send' },
  accepted: { label: 'Angenommen', color: 'green', icon: 'CheckCircle' },
  rejected: { label: 'Abgelehnt', color: 'red', icon: 'XCircle' },
  expired: { label: 'Abgelaufen', color: 'orange', icon: 'Clock' }
};

interface OfferProviderProps {
  children: React.ReactNode;
}

export const OfferProvider: React.FC<OfferProviderProps> = ({ children }) => {
  // Firebase Real-time Listener mit Custom Hook
  const {
    data: offers,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener<Offer>(OfferService.subscribeToOffers);

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  const { calculateOfferTotals, calculateValidUntil, settings: calcSettings } = useCalculation();
  const { user } = useAuth();

  // Neues Angebot erstellen
  const createOffer = useCallback(async (
    offerData: Partial<Offer>
  ): Promise<{ success: boolean; offerId?: string; offerNumber?: string; error?: string }> => {
    try {
      crud.setLoading(true);

      // Angebotsnummer generieren
      const offerNumber = await OfferService.getNextOfferNumber();

      // Summen berechnen
      const totalsResult = calculateOfferTotals(
        offerData.items || [],
        (offerData as unknown as { discountPercent?: number }).discountPercent || 0
      );

      // Convert OfferTotalsResult to OfferTotals
      const totals = {
        subtotalNet: totalsResult.subtotalNet,
        netTotal: totalsResult.netTotal,
        discountPercent: totalsResult.discountPercent,
        discountAmount: totalsResult.discountAmount,
        vatRate: totalsResult.taxRate,
        vatAmount: totalsResult.taxAmount,
        grossTotal: totalsResult.grossTotal
      };

      // Gültigkeitsdatum berechnen
      const validUntil = offerData.conditions?.validUntil || calculateValidUntil();

      // Eindeutige ID basierend auf Angebotsnummer generieren
      const offerId = `offer-${offerNumber}-${Date.now()}`;

      const newOffer: Partial<Offer> = {
        ...offerData,
        id: offerId,
        offerNumber,
        status: offerData.status || OfferStatusEnum.DRAFT,
        totals,
        conditions: {
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

      const result = await OfferService.addOffer(newOffer as unknown as Offer);
      return { success: true, offerId: result.id as string, offerNumber };
    } catch (err) {
      console.error('Error creating offer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    } finally {
      crud.setLoading(false);
    }
  }, [crud, calculateOfferTotals, calculateValidUntil, calcSettings, user]);

  // Angebot aktualisieren
  const updateOffer = useCallback(async (
    offerId: string,
    offerData: Partial<Offer>,
    changeDescription: string = 'Aktualisiert'
  ): Promise<{ success: boolean; error?: string }> => {
    const existingOffer = offers.find(o => o.id === offerId);
    if (!existingOffer) {
      return { success: false, error: 'Angebot nicht gefunden' };
    }

    // Summen neu berechnen
    const totalsResult = calculateOfferTotals(
      offerData.items || [],
      offerData.totals?.discountPercent || 0
    );

    // Convert OfferTotalsResult to OfferTotals
    const totals = {
      subtotalNet: totalsResult.subtotalNet,
      netTotal: totalsResult.netTotal,
      discountPercent: totalsResult.discountPercent,
      discountAmount: totalsResult.discountAmount,
      vatRate: totalsResult.taxRate,
      vatAmount: totalsResult.taxAmount,
      grossTotal: totalsResult.grossTotal
    };

    // Version erhöhen und History aktualisieren
    const newVersion = (existingOffer.version || 1) + 1;
    const history: OfferHistoryEntry[] = [
      ...(existingOffer.history || []),
      {
        version: newVersion,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || 'system',
        changes: changeDescription
      }
    ];

    const updatedOffer: Partial<Offer> = {
      ...offerData,
      totals,
      version: newVersion,
      history
    };

    return crud.execute(() => OfferService.updateOffer(offerId, updatedOffer));
  }, [crud, offers, calculateOfferTotals, user]);

  // Angebot löschen
  const deleteOffer = useCallback(async (offerId: string): Promise<{ success: boolean; error?: string }> => {
    return crud.execute(() => OfferService.deleteOffer(offerId));
  }, [crud]);

  // Angebot duplizieren
  const duplicateOffer = useCallback(async (
    offerId: string
  ): Promise<{ success: boolean; offerId?: string; offerNumber?: string; error?: string }> => {
    const originalOffer = offers.find(o => o.id === offerId);
    if (!originalOffer) {
      return { success: false, error: 'Angebot nicht gefunden' };
    }

    const { id: _id, offerNumber, createdAt: _createdAt, updatedAt: _updatedAt, history: _history, version: _version, status: _status, ...offerData } = originalOffer;

    return createOffer({
      ...offerData,
      conditions: {
        ...offerData.conditions,
        notes: `Kopie von ${offerNumber}\n${offerData.conditions?.notes || ''}`
      }
    });
  }, [offers, createOffer]);

  // Status ändern
  const updateOfferStatus = useCallback(async (
    offerId: string,
    newStatus: OfferStatus
  ): Promise<{ success: boolean; error?: string }> => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) {
      return { success: false, error: 'Angebot nicht gefunden' };
    }

    const statusData: Partial<Offer> = {
      status: newStatus
    };

    // Zusätzliche Timestamps je nach Status
    if (newStatus === OfferStatusEnum.SENT) {
      statusData.sentAt = new Date().toISOString();
    } else if (newStatus === OfferStatusEnum.ACCEPTED) {
      statusData.acceptedAt = new Date().toISOString();
    } else if (newStatus === OfferStatusEnum.REJECTED) {
      statusData.rejectedAt = new Date().toISOString();
    }

    return crud.execute(() => OfferService.updateOffer(offerId, {
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
    }));
  }, [crud, offers, user]);

  // Position zu einem Angebot hinzufügen
  const addOfferItem = useCallback(async (
    offer: Offer,
    newItem: ExtendedOfferItem
  ): Promise<{ success: boolean; error?: string }> => {
    const items = [...(offer.items || [])];
    const newPosition = items.length + 1;

    const item = {
      ...newItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: newPosition,
      totalNet: (newItem.quantity || 1) * (newItem.unitPriceNet || 0) * (1 - (newItem.discount || 0) / 100)
    };

    items.push(item);

    return updateOffer(offer.id, { ...offer, items }, 'Position hinzugefügt');
  }, [updateOffer]);

  // Position aktualisieren
  const updateOfferItem = useCallback(async (
    offer: Offer,
    itemId: string,
    updates: Partial<ExtendedOfferItem>
  ): Promise<{ success: boolean; error?: string }> => {
    const items = (offer.items || []).map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        updatedItem.totalNet = (updatedItem.quantity || 1) * (updatedItem.unitPriceNet || 0) * (1 - (updatedItem.discount || 0) / 100);
        return updatedItem;
      }
      return item;
    });

    return updateOffer(offer.id, { ...offer, items }, 'Position aktualisiert');
  }, [updateOffer]);

  // Position entfernen
  const removeOfferItem = useCallback(async (
    offer: Offer,
    itemId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const items = (offer.items || [])
      .filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, position: index + 1 }));

    return updateOffer(offer.id, { ...offer, items }, 'Position entfernt');
  }, [updateOffer]);

  // Positionen neu sortieren
  const reorderOfferItems = useCallback(async (
    offer: Offer,
    fromIndex: number,
    toIndex: number
  ): Promise<{ success: boolean; error?: string }> => {
    const items = [...(offer.items || [])];
    const [removed] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, removed);

    const reorderedItems = items.map((item, index) => ({ ...item, position: index + 1 }));

    return updateOffer(offer.id, { ...offer, items: reorderedItems }, 'Positionen neu sortiert');
  }, [updateOffer]);

  // Angebote nach Kunde
  const getOffersByCustomer = useCallback((customerId: string): Offer[] => {
    return offers.filter(o => o.customerID === customerId);
  }, [offers]);

  // Angebote nach Projekt
  const getOffersByProject = useCallback((projectId: string): Offer[] => {
    return offers.filter(o => o.projectID === projectId);
  }, [offers]);

  // Angebote nach Status
  const getOffersByStatus = useCallback((status: OfferStatus): Offer[] => {
    return offers.filter(o => o.status === status);
  }, [offers]);

  // Angebot nach ID
  const _getOfferById = useCallback((offerId: string): Offer | undefined => {
    return offers.find(o => o.id === offerId);
  }, [offers]);

  // Abgelaufene Angebote prüfen und Status aktualisieren
  const checkExpiredOffers = useCallback(async (): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];

    for (const offer of offers) {
      if (
        offer.status === OfferStatusEnum.SENT &&
        offer.conditions?.validUntil &&
        offer.conditions.validUntil < today
      ) {
        await updateOfferStatus(offer.id, OfferStatusEnum.EXPIRED);
      }
    }
  }, [offers, updateOfferStatus]);

  // Statistiken
  const getStatistics = useCallback((): OfferStatistics => {
    const stats: OfferStatistics = {
      total: offers.length,
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      totalValue: 0,
      acceptedValue: 0,
      pendingValue: 0
    };

    Object.values(OfferStatusEnum).forEach(status => {
      const count = offers.filter(o => o.status === status).length;
      if (status === OfferStatusEnum.DRAFT) stats.draft = count;
      else if (status === OfferStatusEnum.SENT) stats.sent = count;
      else if (status === OfferStatusEnum.ACCEPTED) stats.accepted = count;
      else if (status === OfferStatusEnum.REJECTED) stats.rejected = count;
      else if (status === OfferStatusEnum.EXPIRED) stats.expired = count;
    });

    offers.forEach(offer => {
      const value = offer.totals?.grossTotal || 0;
      stats.totalValue += value;
      if (offer.status === OfferStatusEnum.ACCEPTED) {
        stats.acceptedValue += value;
      } else if (offer.status === OfferStatusEnum.SENT) {
        stats.pendingValue += value;
      }
    });

    return stats;
  }, [offers]);

  const value: OfferContextValue = {
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
    getOfferById: (offerId: string) => offers.find(o => o.id === offerId),
    checkExpiredOffers,
    getStatistics
  };

  return (
    <OfferContext.Provider value={value}>
      {children}
    </OfferContext.Provider>
  );
};
