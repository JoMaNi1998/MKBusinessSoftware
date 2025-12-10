import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgMnsvaoUiygFzMeOmijrPrLHzVX6M7U4",
  authDomain: "mkbusinesssoftware.firebaseapp.com",
  projectId: "mkbusinesssoftware",
  storageBucket: "mkbusinesssoftware.firebasestorage.app",
  messagingSenderId: "72172721680",
  appId: "1:72172721680:web:0b9f8a03df159f7e6cdc95",
  measurementId: "G-JNT8HQFTF5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore Datenbank
export const db = getFirestore(app);

// Firebase Functions
export const functions = getFunctions(app);

// Firebase Storage
export const storage = getStorage(app);

export default app;
