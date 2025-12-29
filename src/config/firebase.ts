import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// Your web app's Firebase configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyDgMnsvaoUiygFzMeOmijrPrLHzVX6M7U4",
  authDomain: "mkbusinesssoftware.firebaseapp.com",
  projectId: "mkbusinesssoftware",
  storageBucket: "mkbusinesssoftware.firebasestorage.app",
  messagingSenderId: "72172721680",
  appId: "1:72172721680:web:0b9f8a03df159f7e6cdc95",
  measurementId: "G-JNT8HQFTF5"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Firestore Datenbank
export const db: Firestore = getFirestore(app);

// Firebase Functions
export const functions: Functions = getFunctions(app);

// Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

// Firebase Auth
export const auth: Auth = getAuth(app);

export default app;
