# 🏭 Lager Management System

Modernes Lagermanagement-System für PV-Materialien mit React und Firebase.

## 🚀 Features

- **Material-Management** - Vollständige Verwaltung von PV-Materialien
- **Lagerbestand** - Real-time Bestandsüberwachung
- **Kunden-Verwaltung** - Kundendaten und Projekte
- **PV-Konfigurator** - Automatische Stücklisten-Generierung
- **Buchungssystem** - Ein- und Ausgangsbuchungen
- **Projekt-Management** - Projektbezogene Material-Zuordnung

## 🛠️ Tech Stack

- **Frontend:** React 18, Tailwind CSS, Lucide Icons
- **Backend:** Firebase (Firestore, Hosting, Authentication)
- **Build:** Create React App, ESLint
- **CI/CD:** GitHub Actions

## 📦 Installation

```bash
# Repository klonen
git clone <repository-url>
cd Lager

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm start
```

## 🔧 Verfügbare Scripts

```bash
# Entwicklung
npm start              # Entwicklungsserver (http://localhost:3000)fff
npm test               # Tests ausführen
npm run build          # Production Build erstellen tt

# Code Quality
npm run lint           # ESLint ausführen
npm run lint:fix       # ESLint mit Auto-Fix

# Firebase Deployment
npm run deploy         # Komplettes Deployment
npm run deploy:hosting # Nur Hosting deployen
npm run deploy:rules   # Nur Firestore Rules deployen

# Firebase Tools
npm run serve          # Lokaler Firebase Hosting Server
npm run emulators      # Firebase Emulators starten
npm run logs           # Firebase Logs anzeigen
```

## 🌐 Deployment

### Automatisches Deployment (GitHub Actions)

Das Projekt verwendet GitHub Actions für automatisches CI/CD:

- **main Branch** → Production Environment
- **develop Branch** → Development Environment  
- **Pull Requests** → Preview Channels (7 Tage)

### Setup Requirements

1. **Firebase Service Account** erstellen:
   ```bash
   # Service Account Key generieren
   firebase projects:list
   # Im Firebase Console → Project Settings → Service Accounts
   ```

2. **GitHub Secrets** konfigurieren:
   - `FIREBASE_SERVICE_ACCOUNT` - Service Account JSON

3. **Firebase Projekte** in `.firebaserc` konfigurieren:
   ```json
   {
     "projects": {
       "production": "lager-d3a17",
       "development": "lager-dev-project"
     }
   }
   ```

### Manuelles Deployment

```bash
# Firebase CLI installieren
npm install -g firebase-tools

# Anmelden
firebase login

# Projekt auswählen
firebase use production

# Deployen
npm run deploy
```

## 🏗️ Projekt-Struktur

```
src/
├── components/          # React Komponenten
│   ├── BaseModal.js    # Wiederverwendbare Modal-Komponente
│   ├── MaterialManagement.js
│   ├── PVConfigurator.js
│   └── ...
├── context/            # React Context (State Management)
│   ├── MaterialContext.js
│   ├── CustomerContext.js
│   └── ...
├── services/           # API Services
│   └── firebaseService.js
├── utils/              # Utility Functions
└── App.js              # Haupt-App-Komponente
```

## 🔥 Firebase Konfiguration

### Firestore Collections

- `materials` - Material-Stammdaten
- `customers` - Kundendaten
- `projects` - Projekt-Informationen
- `bookings` - Lager-Buchungen
- `users` - Benutzer-Verwaltung

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authentifizierte Benutzer können lesen/schreiben
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚦 CI/CD Pipeline

Die GitHub Actions Pipeline führt folgende Schritte aus:

1. **Checks Job:**
   - Code Linting (ESLint)
   - Unit Tests ausführen
   - React App builden
   - Build Artifacts hochladen

2. **Preview Job** (nur bei Pull Requests):
   - Preview Channel deployen
   - 7 Tage Gültigkeit

3. **Deploy Job** (main/develop Branch):
   - Firebase Hosting Deployment
   - Firestore Rules Deployment

## 🔧 Entwicklung

### Neue Features entwickeln

1. Feature Branch erstellen: `git checkout -b feature/neue-funktion`
2. Änderungen implementieren
3. Tests schreiben/aktualisieren
4. Pull Request erstellen
5. Code Review abwarten
6. Nach Merge automatisches Deployment

### Code Style

- ESLint Konfiguration basiert auf `react-app`
- Tailwind CSS für Styling
- Lucide Icons für Icons
- Funktionale Komponenten mit Hooks

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork das Repository
2. Feature Branch erstellen
3. Änderungen committen
4. Pull Request erstellen

## 📄 License

Private Project - Alle Rechte vorbehalten

---

**Entwickelt mit ❤️ für effizientes Lagermanagement**
