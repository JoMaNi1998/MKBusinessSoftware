# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm start              # Development server (includes service worker build)
npm run build          # Production build
npm run lint           # ESLint check (max 100 warnings)
npm run lint:fix       # Auto-fix ESLint issues
npm test               # Run tests

# Firebase
npm run deploy         # Full deploy (hosting + functions + rules)
npm run deploy:hosting # Deploy only hosting
npm run deploy:rules   # Deploy only Firestore rules
npm run emulators      # Start Firebase emulators

# Cloud Functions (im functions/ Ordner)
cd functions && npm run build   # TypeScript kompilieren
cd functions && npm run serve   # Lokal testen
```

### Firebase Emulator Ports
| Service | Port |
|---------|------|
| Firestore | 5003 |
| Functions | 5004 |
| Hosting | 5008 |

---

## Pflicht: CLAUDE.md aktualisieren

Bei Erstellung neuer Dateien in folgenden Ordnern **MUSS** diese Datei aktualisiert werden:

| Ordner / Änderung | Aktion |
|-------------------|--------|
| `src/hooks/` | Neuen Hook in Tabelle "Hooks" eintragen |
| `src/services/` | Neuen Service in Tabelle "Services" eintragen |
| `src/types/` | Neue Type-Datei in Tabelle "Types" eintragen |
| `src/utils/` | Neue Util-Datei in Tabelle "Utils" eintragen |
| `src/context/` | Neuen Context in Tabelle "Contexts" eintragen |
| Neue Firestore Collection | Regel in `firestore.rules` hinzufügen + Tabelle "Firestore Collections" aktualisieren |

---

## Projektstruktur

```
src/
├── components/     # React-Komponenten (nach Feature gruppiert)
├── context/        # React Contexts (State Management)
├── hooks/          # Custom React Hooks
├── services/       # Firebase Services (API-Layer)
├── types/          # TypeScript Type-Definitionen
├── utils/          # Helper-Funktionen
└── config/         # Konfigurationsdateien
```

---

## Types (`src/types/`)

**Immer global definieren, nie lokal in Komponenten!**

| Datei | Inhalt |
|-------|--------|
| `base.types.ts` | BaseDocument, ServiceResult, TimestampInput |
| `enums.ts` | OfferStatus, InvoiceStatus, ProjectStatus, BookingType |
| `contexts/auth.types.ts` | AuthUser, AuthContextValue |
| `contexts/booking.types.ts` | Booking, BookingContextValue |
| `contexts/company.types.ts` | CompanySettings, CompanyContextValue |
| `contexts/confirm.types.ts` | ConfirmOptions, ConfirmContextValue |
| `contexts/customer.types.ts` | Customer, CustomerContact, CustomerContextValue |
| `contexts/material.types.ts` | Material, MaterialContextValue |
| `contexts/notification.types.ts` | Notification, NotificationContextValue |
| `contexts/offer.types.ts` | Offer, OfferItem, OfferContextValue |
| `contexts/project.types.ts` | Project, ProjectContextValue |
| `contexts/role.types.ts` | Role, RoleContextValue |
| `components/bom.types.ts` | BOMItem, BOMContextValue |
| `components/configurator.types.ts` | PVConfiguration, ConfiguratorState |
| `components/filters.types.ts` | FilterState, SortConfig |
| `components/order.types.ts` | Order, OrderItem |
| `components/settings.types.ts` | CalculationSettings, UserSettings |
| `components/vde.types.ts` | VDEProtocol, VDEFormData |
| `components/calendar.types.ts` | CalendarProject, CalendarFilters, UseProjectCalendarReturn |
| `index.ts` | Re-exports aller Types |

---

## Hooks (`src/hooks/`)

| Hook | Zweck | Parameter |
|------|-------|-----------|
| `useFirebaseListener` | Realtime Firebase Subscription | `subscribeFn, options?` |
| `useFirebaseCRUD` | CRUD mit Loading/Error State | - |
| `useMaterialFilters` | Material-Filterung | `materials, categories` |
| `useColumnPreferences` | Spalten-Einstellungen | `userId, showNotification` |
| `useCategoriesAndSpecs` | Kategorien + Specs laden | - |
| `useClickOutside` | Click-Outside Detection | `ref, callback` |
| `useCustomerManagement` | Kunden-Verwaltung | - |
| `useCustomerModal` | Kunden-Modal State | - |
| `useProjectManagement` | Projekt-Verwaltung | - |
| `useProjectModal` | Projekt-Modal State | - |
| `useBookingHistory` | Buchungs-Historie | - |
| `useBookingModal` | Buchungs-Modal State | - |
| `useOfferItems` | Angebots-Positionen | - |
| `useOfferColumnPrefs` | Angebots-Spalten | - |
| `useOrderList` | Auftrags-Liste | - |
| `useOrderColumnPrefs` | Auftrags-Spalten | - |
| `useProjectColumnPrefs` | Projekt-Spalten | - |
| `useInvoiceConfigurator` | Rechnungs-Konfigurator | - |
| `useInvoiceManagement` | Rechnungs-Verwaltung | - |
| `usePriceCalculation` | Preis-Berechnung | - |
| `useLaborFactors` | Arbeits-Faktoren | - |
| `useBillOfMaterials` | Stücklisten | - |
| `useAutoSelectProject` | Auto-Select bei nur einem Projekt | `customerProjects, selectedProject, setSelectedProject` |
| `useProjectCalendar` | Projektkalender State & Handler | - |

---

## Services (`src/services/`)

| Service | Methoden |
|---------|----------|
| `firebaseService.ts` | `addDocument`, `getDocument`, `getDocuments`, `updateDocument`, `deleteDocument`, `subscribeToCollection`, `queryDocuments` |
| `CounterService.ts` | `getNextNumber(type, prefix)` → z.B. "ANG-2025-0001" |
| `CustomerService.ts` | `getAllCustomers`, `getCustomer`, `addCustomer`, `updateCustomer`, `deleteCustomer`, `subscribeToCustomers` |
| `BookingService.ts` | `getAllBookings`, `addBooking`, `updateBooking`, `deleteBooking`, `subscribeToBookings`, `createBookingMaterial`, `createBookingData` |
| `BookingAggregationService.ts` | `aggregateProjectBookings`, `validateProjectInBooking`, `getMaxReturnableQuantity`, `splitAggregatedByCategory` |
| `InvoiceService.ts` | `getAllInvoices`, `getInvoice`, `addInvoice`, `updateInvoice`, `deleteInvoice`, `getNextInvoiceNumber` |
| `BOMService.ts` | `getBOM`, `createBOM`, `updateBOM`, `deleteBOM` |

---

## Utils (`src/utils/`)

| Datei | Funktionen |
|-------|------------|
| `dateUtils.ts` | `parseTimestamp`, `formatDate`, `formatDateTime`, `formatRelativeTime` |
| `formatters.ts` | `formatPrice`, `buildDescription`, `computeNextMaterialId` |
| `stockStatus.ts` | `getStockStatusText`, `getStockStatusColor` |
| `debounce.ts` | `debounce`, `throttle` |
| `helpers.ts` | Allgemeine Helper |
| `materialHelpers.ts` | Material-spezifische Helper |
| `customerHelpers.ts` | Kunden-spezifische Helper |
| `offerHelpers.ts` | Angebots-spezifische Helper |
| `orderHelpers.ts` | Auftrags-spezifische Helper |
| `invoiceHelpers.ts` | Rechnungs-spezifische Helper |
| `projectHelpers.ts` | Projekt-spezifische Helper |
| `bookingHelpers.ts` | Buchungs-spezifische Helper |
| `pvConfiguratorHelpers.ts` | PV-Konfigurator Helper |

---

## Contexts (`src/context/`)

| Context | Hook | Zweck |
|---------|------|-------|
| `AuthContext.tsx` | `useAuth()` | Authentifizierung |
| `RoleContext.tsx` | `useRole()` | Benutzer-Rollen |
| `NotificationContext.tsx` | `useNotification()` | Toast-Benachrichtigungen |
| `ConfirmContext.tsx` | `useConfirm()` | Bestätigungs-Dialoge |
| `CompanyContext.tsx` | `useCompany()` | Firmen-Einstellungen |
| `CalculationContext.tsx` | `useCalculation()` | Kalkulations-Einstellungen |
| `CustomerContext.tsx` | `useCustomers()` | Kunden-Daten |
| `MaterialContext.tsx` | `useMaterials()` | Material-Daten |
| `ProjectContext.tsx` | `useProjects()` | Projekt-Daten |
| `BookingContext.tsx` | `useBookings()` | Buchungs-Daten |
| `OfferContext.tsx` | `useOffers()` | Angebots-Daten |
| `InvoiceContext.tsx` | `useInvoices()` | Rechnungs-Daten |
| `ServiceCatalogContext.tsx` | `useServiceCatalog()` | Leistungskatalog |
| `ConfiguratorContext.tsx` | `useConfigurator()` | PV-Konfigurator State |

---

## Entwicklungsregeln

### 1. Types global definieren
```typescript
// RICHTIG
import { Customer } from '../types';

// FALSCH - keine lokalen Interfaces für existierende Types
interface CustomerData { id: string; name: string; }
```

### 2. Services statt direkter Firebase-Calls
```typescript
// RICHTIG
import { FirebaseService } from '../services/firebaseService';
await FirebaseService.updateDocument('materials', id, data);

// FALSCH
import { doc, updateDoc } from 'firebase/firestore';
await updateDoc(doc(db, 'materials', id), data);
```

### 3. ConfirmContext statt window.confirm
```typescript
// RICHTIG
const { confirmDelete } = useConfirm();
if (await confirmDelete(name, 'Material')) { ... }

// FALSCH
if (window.confirm('Löschen?')) { ... }
```

### 4. CounterService für Nummern
```typescript
// RICHTIG
const number = await CounterService.getNextNumber('offers', 'ANG');

// FALSCH - lädt alle Dokumente
const offers = await getAllOffers();
const maxNum = offers.reduce(...);
```

### 5. Dateigrößen
- Komponenten: max 300 Zeilen
- Hooks: max 200 Zeilen
- Services: max 400 Zeilen

### 6. Import-Aliases (craco.config.js)
```typescript
import { Component } from '@components/shared';
import { useFirebaseCRUD } from '@hooks';
import { FirebaseService } from '@services/firebaseService';
import { formatPrice } from '@utils';
import { useAuth } from '@context/AuthContext';
import { config } from '@config';
import type { Customer } from '@app-types';
```

| Alias | Pfad |
|-------|------|
| `@` | `src/` |
| `@components` | `src/components/` |
| `@hooks` | `src/hooks/` |
| `@services` | `src/services/` |
| `@utils` | `src/utils/` |
| `@context` | `src/context/` |
| `@config` | `src/config/` |
| `@app-types` | `src/types/` |

### 7. Import-Reihenfolge
```typescript
// 1. React/Third-party
// 2. Contexts (@context)
// 3. Hooks (@hooks)
// 4. Services (@services)
// 5. Types (@app-types)
// 6. Utils (@utils)
// 7. Components (@components)
```

---

## Komponenten-Struktur

```
src/components/[feature]/
├── index.ts                 # Re-exports
├── [Feature]Management.tsx  # Hauptkomponente
├── [Feature]Modal.tsx       # Modal
├── [Feature]List.tsx        # Liste
├── components/              # Unterkomponenten
│   └── index.ts
└── hooks/                   # Feature-Hooks
    └── index.ts
```

### Dateiendungen
- **Komponenten:** `.tsx` (React mit JSX)
- **Hooks, Services, Utils, Types:** `.ts` (kein JSX)

---

## Firestore Collections

| Collection | Beschreibung | Zugriff |
|------------|--------------|---------|
| `materials` | PV-Materialien & Lagerbestand | Auth |
| `customers` | Kundenstammdaten | Auth |
| `offers` | Angebote | Auth |
| `invoices` | Rechnungen | Auth |
| `projects` | Projekte | Auth |
| `bookings` | Lagerbewegungen | Auth |
| `categories` | Materialkategorien | Auth |
| `configurations` | PV-Konfigurationen | Auth |
| `counters` | Nummern-Generierung (ANG-, RE-, etc.) | Auth |
| `users` | Benutzerdaten & Rollen | Owner/Admin |
| `user-preferences` | Spalten-Einstellungen | Auth |
| `calculation-settings` | Kalkulationseinstellungen | Read: Auth, Write: Admin |
| `company-settings` | Firmeneinstellungen | Read: Auth, Write: Admin |

---

## Cloud Functions (`functions/src/index.ts`)

| Function | Beschreibung |
|----------|--------------|
| `setUserRole` | Rolle für Benutzer setzen (nur Admin) |
| `setupFirstAdmin` | Ersten Admin einrichten |
| `setupNewUser` | Neuen Benutzer mit Default-Rolle einrichten |
| `getRoles` | Verfügbare Rollen abrufen |

### Benutzerrollen

| Rolle | Berechtigungen |
|-------|----------------|
| `admin` | Vollzugriff (materials, customers, projects, project-calendar, vde, bookings, orders, settings, pv-configurator) |
| `projektleiter` | materials, customers, projects, project-calendar, vde, bookings, orders, pv-configurator |
| `monteur` | materials, vde, customers, projects |

