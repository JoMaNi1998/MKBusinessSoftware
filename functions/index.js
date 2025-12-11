const { onCall, HttpsError } = require('firebase-functions/v2/https');
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
  monteur: {
    name: 'Monteur',
    permissions: ['materials', 'vde', 'bookings']
  },
  projektleiter: {
    name: 'Projektleiter',
    permissions: ['materials', 'customers', 'projects', 'vde', 'bookings', 'orders', 'pv-configurator']
  }
};

/**
 * Cloud Function: Benutzer-Rolle setzen (nur für Admins)
 */
exports.setUserRole = onCall(async (request) => {
  // Authentifizierung prüfen
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Benutzer muss angemeldet sein');
  }

  // Admin-Berechtigung prüfen
  const callerClaims = request.auth.token;
  if (!callerClaims.role || callerClaims.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Nur Admins können Rollen setzen');
  }

  const { uid, role } = request.data;

  if (!uid || !role) {
    throw new HttpsError('invalid-argument', 'UID und Rolle sind erforderlich');
  }

  if (!ROLES[role]) {
    throw new HttpsError('invalid-argument', 'Ungültige Rolle');
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
      updatedBy: request.auth.uid
    }, { merge: true });

    return { success: true, message: `Rolle "${ROLES[role].name}" erfolgreich gesetzt` };
  } catch (error) {
    console.error('Fehler beim Setzen der Rolle:', error);
    throw new HttpsError('internal', 'Fehler beim Setzen der Rolle');
  }
});

/**
 * Cloud Function: Ersten Admin einrichten
 */
exports.setupFirstAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Benutzer muss angemeldet sein');
  }

  try {
    // Prüfen ob bereits Admin existiert
    const existingUsers = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    if (!existingUsers.empty) {
      throw new HttpsError('failed-precondition', 'Admin bereits vorhanden');
    }

    const uid = request.auth.uid;
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
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: Neuen Benutzer einrichten (manuell aufgerufen nach Registrierung)
 * Ersetzt den automatischen Trigger - keine Identity Platform nötig
 */
exports.setupNewUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Benutzer muss angemeldet sein');
  }

  const uid = request.auth.uid;

  try {
    // Prüfen ob User bereits eingerichtet
    const existingUser = await admin.firestore().collection('users').doc(uid).get();
    if (existingUser.exists) {
      return { success: true, message: 'Benutzer bereits eingerichtet', role: existingUser.data().role };
    }

    // Prüfen ob bereits Admins existieren
    const existingAdmins = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    // Wenn keine Admins existieren, nichts tun (User muss setupFirstAdmin aufrufen)
    if (existingAdmins.empty) {
      return { success: false, message: 'Kein Admin vorhanden. Bitte setupFirstAdmin aufrufen.' };
    }

    // Als Monteur einrichten
    const defaultClaims = {
      role: 'monteur',
      permissions: ROLES.monteur.permissions
    };

    const user = await admin.auth().getUser(uid);

    // Custom Claims setzen
    await admin.auth().setCustomUserClaims(uid, defaultClaims);

    // In Firestore speichern
    await admin.firestore().collection('users').doc(uid).set({
      email: user.email,
      displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
      role: 'monteur',
      permissions: ROLES.monteur.permissions,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Benutzer als Monteur eingerichtet', role: 'monteur' };
  } catch (error) {
    console.error('Fehler beim Einrichten des neuen Benutzers:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: Alle verfügbaren Rollen abrufen
 */
exports.getRoles = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Benutzer muss angemeldet sein');
  }

  return ROLES;
});
