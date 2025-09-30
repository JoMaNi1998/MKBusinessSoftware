const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Benutzerrollen definieren
 */
const ROLES = {
  admin: {
    name: 'Administrator',
    permissions: ['materials', 'customers', 'projects', 'vde', 'bookings', 'orders', 'settings', 'pv-configurator']
  },
  pv_admin: {
    name: 'PV Administrator', 
    permissions: ['pv-configurator', 'settings']
  },
  mitarbeiter: {
    name: 'Mitarbeiter',
    permissions: ['materials', 'customers', 'projects', 'vde', 'bookings']
  },
  readonly: {
    name: 'Nur Lesen',
    permissions: ['materials', 'customers', 'projects']
  }
};

/**
 * Cloud Function: Benutzer-Rolle setzen (nur für Admins)
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Authentifizierung prüfen
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Benutzer muss angemeldet sein');
  }

  // Admin-Berechtigung prüfen
  const callerClaims = context.auth.token;
  if (!callerClaims.role || callerClaims.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Nur Admins können Rollen setzen');
  }

  const { uid, role } = data;

  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'UID und Rolle sind erforderlich');
  }

  if (!ROLES[role]) {
    throw new functions.https.HttpsError('invalid-argument', 'Ungültige Rolle');
  }

  try {
    // Custom Claims setzen
    const customClaims = {
      role: role,
      permissions: ROLES[role].permissions
    };

    await admin.auth().setCustomUserClaims(uid, customClaims);

    // Optional: In Firestore für erweiterte Daten speichern
    await admin.firestore().collection('users').doc(uid).set({
      role: role,
      permissions: ROLES[role].permissions,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid
    }, { merge: true });

    return { success: true, message: `Rolle "${ROLES[role].name}" erfolgreich gesetzt` };
  } catch (error) {
    console.error('Fehler beim Setzen der Rolle:', error);
    throw new functions.https.HttpsError('internal', 'Fehler beim Setzen der Rolle');
  }
});

/**
 * Cloud Function: Ersten Admin einrichten
 */
exports.setupFirstAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Benutzer muss angemeldet sein');
  }

  try {
    // Prüfen ob bereits Admin existiert
    const existingUsers = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    if (!existingUsers.empty) {
      throw new functions.https.HttpsError('failed-precondition', 'Admin bereits vorhanden');
    }

    const uid = context.auth.uid;
    const user = await admin.auth().getUser(uid);

    // Custom Claims für Admin setzen
    const adminClaims = {
      role: 'admin',
      permissions: ROLES.admin.permissions,
      isFirstAdmin: true
    };

    await admin.auth().setCustomUserClaims(uid, adminClaims);

    // In Firestore speichern
    await admin.firestore().collection('users').doc(uid).set({
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      role: 'admin',
      permissions: ROLES.admin.permissions,
      isFirstAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Erster Admin erfolgreich eingerichtet' };
  } catch (error) {
    console.error('Fehler beim Einrichten des ersten Admins:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Trigger: Neue Benutzer automatisch als Mitarbeiter einrichten
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // Prüfen ob bereits Admins existieren
    const existingAdmins = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    // Wenn Admins existieren, als Mitarbeiter einrichten
    if (!existingAdmins.empty) {
      const defaultClaims = {
        role: 'mitarbeiter',
        permissions: ROLES.mitarbeiter.permissions
      };

      await admin.auth().setCustomUserClaims(user.uid, defaultClaims);

      await admin.firestore().collection('users').doc(user.uid).set({
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: 'mitarbeiter',
        permissions: ROLES.mitarbeiter.permissions,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Fehler beim Einrichten des neuen Benutzers:', error);
  }
});

/**
 * Cloud Function: Alle verfügbaren Rollen abrufen
 */
exports.getRoles = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Benutzer muss angemeldet sein');
  }

  return ROLES;
});
