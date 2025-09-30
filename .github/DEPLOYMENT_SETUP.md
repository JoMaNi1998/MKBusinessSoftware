# 🚀 Deployment Setup Guide

Schritt-für-Schritt Anleitung zur Einrichtung des automatischen Deployments für das Lager Management System.

## 📋 Voraussetzungen

- GitHub Repository mit Admin-Rechten
- Firebase Projekt erstellt
- Firebase CLI installiert (`npm install -g firebase-tools`)

## 🔧 1. Firebase Service Account erstellen

### Option A: Firebase Console (Empfohlen)

1. **Firebase Console öffnen:** https://console.firebase.google.com
2. **Projekt auswählen:** `lager-d3a17`
3. **Project Settings → Service Accounts**
4. **"Generate new private key"** klicken
5. **JSON-Datei herunterladen** und sicher aufbewahren

### Option B: Firebase CLI

```bash
# Anmelden
firebase login

# Service Account erstellen
firebase projects:list
firebase serviceaccounts:create github-actions --project lager-d3a17

# Key generieren
firebase serviceaccounts:generate-key github-actions@lager-d3a17.iam.gserviceaccount.com
```

## 🔐 2. GitHub Secrets konfigurieren

1. **GitHub Repository öffnen**
2. **Settings → Secrets and variables → Actions**
3. **"New repository secret"** klicken

### Erforderliche Secrets:

| Secret Name | Wert | Beschreibung |
|-------------|------|--------------|
| `FIREBASE_SERVICE_ACCOUNT` | Kompletter JSON-Inhalt | Service Account Credentials |

**Beispiel JSON-Format:**
```json
{
  "type": "service_account",
  "project_id": "lager-d3a17",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "github-actions@lager-d3a17.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

## 🏗️ 3. Multi-Environment Setup (Optional)

Für separate Development/Production Environments:

### Development Projekt erstellen

```bash
# Neues Firebase Projekt für Development
firebase projects:create lager-dev

# Firestore aktivieren
firebase firestore:create --project lager-dev
```

### .firebaserc aktualisieren

```json
{
  "projects": {
    "default": "lager-d3a17",
    "production": "lager-d3a17",
    "development": "lager-dev"
  }
}
```

### Workflow anpassen

In `.github/workflows/deploy.yml`:

```yaml
env:
  PROJECT_PROD: lager-d3a17
  PROJECT_DEV: lager-dev        # Development Projekt
```

## 🚦 4. Deployment testen

### Automatischer Test

1. **Feature Branch erstellen:**
   ```bash
   git checkout -b test/deployment-setup
   git push origin test/deployment-setup
   ```

2. **Pull Request erstellen** → Löst Preview Deployment aus

3. **PR mergen in develop** → Löst Development Deployment aus

4. **develop → main mergen** → Löst Production Deployment aus

### Manueller Test

```bash
# Lokaler Build Test
npm run build

# Firebase CLI Test
firebase use production
firebase deploy --only hosting --project lager-d3a17
```

## 📊 5. Deployment Monitoring

### GitHub Actions überwachen

- **Actions Tab** im GitHub Repository
- **Workflow Runs** zeigen Status und Logs
- **Failed Runs** zeigen detaillierte Fehlermeldungen

### Firebase Console überwachen

- **Hosting Tab** zeigt Deployment History
- **Usage Tab** zeigt Traffic und Performance
- **Firestore Tab** für Datenbank-Monitoring

## 🔍 6. Troubleshooting

### Häufige Probleme

#### ❌ "Permission denied" Fehler

**Lösung:** Service Account Berechtigungen prüfen

```bash
# IAM Rollen prüfen
gcloud projects get-iam-policy lager-d3a17

# Erforderliche Rollen:
# - Firebase Admin
# - Cloud Build Editor (falls Functions verwendet)
```

#### ❌ "Project not found" Fehler

**Lösung:** Projekt-ID in `.firebaserc` und Workflow prüfen

#### ❌ Build Fehler

**Lösung:** Dependencies und Node Version prüfen

```yaml
# In deploy.yml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20  # Aktuelle LTS Version
```

### Debug Commands

```bash
# Firebase CLI Debug
firebase deploy --debug

# GitHub Actions Logs
# Verfügbar im Actions Tab des Repositories

# Lokale Emulation
npm run emulators
```

## 📈 7. Performance Optimierung

### Build Optimierung

```json
// package.json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

### Firebase Hosting Konfiguration

```json
// firebase.json
{
  "hosting": {
    "public": "build",
    "headers": [
      {
        "source": "/static/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

## ✅ 8. Deployment Checklist

- [ ] Firebase Service Account erstellt
- [ ] GitHub Secrets konfiguriert
- [ ] `.firebaserc` aktualisiert
- [ ] Workflow-Datei committed
- [ ] Test-Deployment erfolgreich
- [ ] Production-Deployment erfolgreich
- [ ] Monitoring eingerichtet

## 🎯 Nächste Schritte

1. **Custom Domain** konfigurieren (optional)
2. **SSL Zertifikat** einrichten (automatisch)
3. **Backup-Strategie** für Firestore implementieren
4. **Performance Monitoring** aktivieren

---

**Bei Fragen oder Problemen:** GitHub Issues erstellen oder Dokumentation konsultieren.
