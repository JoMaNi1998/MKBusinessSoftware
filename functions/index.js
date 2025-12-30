const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Benutzerrollen definieren
 */
const ROLES = {
  admin: {
    name: 'Administrator',
    permissions: ['materials', 'customers', 'projects', 'project-calendar', 'vde', 'bookings', 'orders', 'settings', 'pv-configurator']
  },
  monteur: {
    name: 'Monteur',
    permissions: ['materials', 'vde', 'customers', 'projects']
  },
  projektleiter: {
    name: 'Projektleiter',
    permissions: ['materials', 'customers', 'projects', 'project-calendar', 'vde', 'bookings', 'orders', 'pv-configurator']
  }
};

/**
 * Cloud Function: Benutzer-Rolle setzen (nur für Admins)
 */
exports.setUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Benutzer muss angemeldet sein');
  }

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
    const customClaims = {
      role: role,
      permissions: ROLES[role].permissions
    };

    await admin.auth().setCustomUserClaims(uid, customClaims);

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
    const existingUsers = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    if (!existingUsers.empty) {
      throw new HttpsError('failed-precondition', 'Admin bereits vorhanden');
    }

    const uid = request.auth.uid;
    const user = await admin.auth().getUser(uid);

    const adminClaims = {
      role: 'admin',
      permissions: ROLES.admin.permissions,
      isFirstAdmin: true
    };

    await admin.auth().setCustomUserClaims(uid, adminClaims);

    await admin.firestore().collection('users').doc(uid).set({
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0],
      role: 'admin',
      permissions: ROLES.admin.permissions,
      isFirstAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Erster Admin erfolgreich eingerichtet' };
  } catch (error) {
    console.error('Fehler beim Einrichten des ersten Admins:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', errorMessage);
  }
});

/**
 * Cloud Function: Neuen Benutzer einrichten (manuell aufgerufen nach Registrierung)
 */
exports.setupNewUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Benutzer muss angemeldet sein');
  }

  const uid = request.auth.uid;

  try {
    const existingUser = await admin.firestore().collection('users').doc(uid).get();
    if (existingUser.exists) {
      return { success: true, message: 'Benutzer bereits eingerichtet', role: existingUser.data()?.role };
    }

    const existingAdmins = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    if (existingAdmins.empty) {
      return { success: false, message: 'Kein Admin vorhanden. Bitte setupFirstAdmin aufrufen.' };
    }

    const defaultClaims = {
      role: 'monteur',
      permissions: ROLES.monteur.permissions
    };

    const user = await admin.auth().getUser(uid);

    await admin.auth().setCustomUserClaims(uid, defaultClaims);

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', errorMessage);
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

/**
 * Cloud Function: Neuen Benutzer mit Rolle erstellen (nur für Admins)
 */
exports.createUserWithRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Benutzer muss angemeldet sein');
  }

  const callerClaims = request.auth.token;
  if (!callerClaims.role || callerClaims.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Nur Admins können Benutzer erstellen');
  }

  const { email, password, displayName, role } = request.data;

  if (!email || !password || !role) {
    throw new HttpsError('invalid-argument', 'Email, Passwort und Rolle sind erforderlich');
  }

  if (!ROLES[role]) {
    throw new HttpsError('invalid-argument', 'Ungültige Rolle');
  }

  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Passwort muss mindestens 6 Zeichen haben');
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0]
    });

    const customClaims = {
      role: role,
      permissions: ROLES[role].permissions
    };
    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);

    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: role,
      permissions: ROLES[role].permissions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid
    });

    return {
      success: true,
      message: `Benutzer "${email}" erfolgreich erstellt`,
      uid: userRecord.uid
    };
  } catch (error) {
    console.error('Fehler beim Erstellen des Benutzers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    throw new HttpsError('internal', errorMessage);
  }
});
