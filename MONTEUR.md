# Monteur Mobile App - Detaillierter Implementierungsplan

## Übersicht

Eine mobile-optimierte Ansicht für Monteure unter `/monteur/*`, die nur die für den Außendienst relevanten Funktionen bereitstellt.

---

## Status-Übersicht

| Komponente | Status | Datei |
|------------|--------|-------|
| **Phase 1: Basis-Infrastruktur** | | |
| ProjectPhoto Types | FERTIG | `src/types/components/projectPhoto.types.ts` |
| PhotoService | FERTIG | `src/services/PhotoService.ts` |
| Project.assignedUsers | FERTIG | `src/types/base.types.ts:143` |
| **Phase 2: Layout & Routing** | | |
| MonteurLayout | FERTIG | `src/components/monteur/MonteurLayout.tsx` |
| Route `/monteur/*` | FERTIG | `src/App.tsx:36, 61-68` |
| MonteurDashboard | FERTIG | `src/components/monteur/MonteurDashboard.tsx` |
| **Phase 3: Projekt-Ansichten** | | |
| MonteurProjectList | FERTIG | `src/components/monteur/MonteurProjectList.tsx` |
| MonteurProjectDetail | FERTIG | `src/components/monteur/MonteurProjectDetail.tsx` |
| useMonteurProjects Hook | FERTIG | `src/components/monteur/hooks/useMonteurProjects.ts` |
| **Phase 4: Material-Funktionen** | | |
| MaterialBooking | FERTIG | `src/components/monteur/components/MaterialBooking.tsx` |
| QR-Scanner Integration | FERTIG | Nutzt `QRScannerModal` aus shared |
| **Phase 5: VDE Integration** | | |
| VDEProtocolView | FERTIG | `src/components/monteur/components/VDEProtocolView.tsx` |
| **Phase 6: Foto-Upload** | | |
| PhotoUpload | FERTIG | `src/components/monteur/components/PhotoUpload.tsx` |
| PhotoGallery | FERTIG | `src/components/monteur/components/PhotoGallery.tsx` |
| PhotoLightbox | FERTIG | `src/components/monteur/components/PhotoLightbox.tsx` |
| useProjectPhotos Hook | FERTIG | `src/components/monteur/hooks/useProjectPhotos.ts` |
| **Phase 7: Bestellfunktion** | | |
| OrderRequest | FERTIG | `src/components/monteur/components/OrderRequest.tsx` |
| **Phase 8: Admin-Erweiterungen** | | |
| Mitarbeiter-Zuweisung UI | OFFEN | `src/components/projects/ProjectModal.tsx` |
| Foto-Übersicht pro Projekt | OFFEN | Admin-Ansicht |

---

## Offene Aufgaben (TODO)

### Phase 8: Admin-Erweiterungen

#### 8.1 Mitarbeiter-Zuweisung in Projekt-Modal

**Datei:** `src/components/projects/ProjectModal.tsx`

**Anforderungen:**
- Multi-Select für User-IDs (Monteure)
- Anzeige aller User mit Rolle "monteur"
- Speicherung in `project.assignedUsers[]`

**Implementierung:**
```typescript
// 1. Users mit Monteur-Rolle laden (aus Firebase oder RoleContext)
// 2. Multi-Select Dropdown im Modal
// 3. Beim Speichern: assignedUsers in Projekt-Dokument aktualisieren
```

**UI-Vorschlag:**
```
┌─────────────────────────────────────┐
│ Mitarbeiter zuweisen                │
│ ┌─────────────────────────────────┐ │
│ │ ☑ Max Mustermann                │ │
│ │ ☑ Hans Schmidt                  │ │
│ │ ☐ Peter Müller                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 8.2 Foto-Übersicht im Admin-Bereich

**Datei:** `src/components/projects/ProjectModal.tsx` (neuer Tab) oder separate Komponente

**Anforderungen:**
- Galerie aller Projektfotos im Admin-Bereich
- Löschen von Fotos (mit Confirm-Dialog)
- Vollbild-Ansicht (Lightbox)

**Implementierung:**
- Wiederverwendung von `PhotoGallery` und `PhotoLightbox` aus Monteur-Komponenten
- Integration in Projekt-Detail-Ansicht oder Modal

---

## Bereits implementierte Features

### MonteurLayout (`src/components/monteur/MonteurLayout.tsx`)
- Mobile-optimiertes Layout ohne Desktop-Sidebar
- Header mit Zurück-Button und User-Avatar
- Bottom-Navigation (Start, Projekte)
- Safe-Area Support für Notch-Geräte

### MonteurDashboard (`src/components/monteur/MonteurDashboard.tsx`)
- Begrüßung mit User-Namen
- Statistik-Karten (Aktive Projekte, Heute)
- Quick-Actions zu Projekten

### MonteurProjectList (`src/components/monteur/MonteurProjectList.tsx`)
- Gefilterte Projektliste (nur zugewiesene Projekte)
- Projekt-Karten mit Status, Kunde, Adresse
- Pull-to-Refresh Pattern

### MonteurProjectDetail (`src/components/monteur/MonteurProjectDetail.tsx`)
- Projekt-Header mit Status und Kunde
- Google Maps Link für Adresse
- 4 Aktions-Karten: Fotos, Material, VDE, Bestellen
- Expandierbare Sektionen für jede Funktion

### MaterialBooking (`src/components/monteur/components/MaterialBooking.tsx`)
- QR-Scanner für Material-Erfassung
- Material-Liste mit Mengen-Steuerung (+/-)
- Ein-/Ausbuchen mit Bestandsvalidierung
- Integration mit BookingContext

### VDEProtocolView (`src/components/monteur/components/VDEProtocolView.tsx`)
- Liste der VDE-Protokolle für Projekt
- Status-Anzeige (Erstellt, Geprüft, Abgeschlossen)
- Öffnen/Bearbeiten via VDEProtocolModal

### PhotoUpload (`src/components/monteur/components/PhotoUpload.tsx`)
- Kamera-Zugriff via File-Input
- Upload-Button mit Loading-State

### PhotoGallery (`src/components/monteur/components/PhotoGallery.tsx`)
- Grid-Ansicht der Fotos
- Thumbnail-Darstellung
- Löschen-Funktion

### PhotoLightbox (`src/components/monteur/components/PhotoLightbox.tsx`)
- Vollbild-Ansicht einzelner Fotos
- Navigation zwischen Fotos
- Schließen-Button

### OrderRequest (`src/components/monteur/components/OrderRequest.tsx`)
- Material zur Bestellliste hinzufügen
- QR-Scanner Integration
- Direkte Integration mit Order-System

### PhotoService (`src/services/PhotoService.ts`)
- Upload mit automatischer Komprimierung (max 1920px, 80% JPEG)
- Firestore-Dokument erstellen
- Löschen (Storage + Firestore)
- Query nach Projekt-ID

---

## Firestore Collections

| Collection | Status | Beschreibung |
|------------|--------|--------------|
| `project-photos` | FERTIG | Foto-Metadaten mit Storage-URL |
| `projects.assignedUsers` | FERTIG | Feld in Projects-Collection |

---

## Firebase Storage Struktur

```
projects/
└── {projectId}/
    └── photos/
        └── {timestamp}_{randomId}.jpg
```

**Storage Rules:** Bereits konfiguriert in `storage.rules` (allow all für Auth-User)

---

## Route-Struktur

| Route | Komponente | Status |
|-------|------------|--------|
| `/monteur` | MonteurDashboard | FERTIG |
| `/monteur/projekte` | MonteurProjectList | FERTIG |
| `/monteur/projekt/:id` | MonteurProjectDetail | FERTIG |

---

## Automatische Weiterleitung

**Status:** OFFEN

Monteure sollten automatisch zu `/monteur` weitergeleitet werden statt `/materials`.

**Implementierung in `App.tsx`:**
```typescript
// In ProtectedRoute oder nach Login:
if (userRole === 'monteur') {
  navigate('/monteur');
}
```

---

## Benutzerrollen

| Rolle | Monteur-Bereich Zugriff | Haupt-App Zugriff |
|-------|------------------------|-------------------|
| `admin` | Ja (optional) | Ja |
| `projektleiter` | Ja (optional) | Ja |
| `monteur` | Ja (Standardansicht) | Eingeschränkt |

---

## Nächste Schritte (Priorisiert)

1. **Automatische Weiterleitung für Monteure** - Monteure direkt zu `/monteur` leiten
2. **Mitarbeiter-Zuweisung UI** - Admin kann Monteure Projekten zuweisen
3. **Foto-Übersicht im Admin** - Admin kann Projektfotos einsehen
4. **Firestore Rules härten** - Storage/Firestore Rules für Production

---

## Technische Hinweise

### Mobile-First Design
- Alle Touch-Targets mindestens 44x44px
- `touch-manipulation` für bessere Touch-Performance
- `safe-area-inset` für Notch-Geräte

### PWA-Unterstützung
- App ist bereits PWA-fähig
- Service Worker in `public/service-worker.js`
- Offline-Caching für statische Assets

### Foto-Komprimierung
- Client-seitig vor Upload
- Max 1920x1920px
- JPEG 80% Qualität
- Reduziert Upload-Zeit und Storage-Kosten

---

## Später: Zeiterfassung

Die Zeiterfassung wird als separates Feature implementiert und umfasst:
- Start/Stop Timer
- Urlaub/Krankheit Verwaltung
- Überstunden-Berechnung
- Korrekturanträge
- Admin-Dashboard für Zeitübersichten
