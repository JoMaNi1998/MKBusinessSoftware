import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCY7Ft5BvH7fdNHH6yG9C3MQgylR05aM6k",
  authDomain: "lager-d3a17.firebaseapp.com",
  projectId: "lager-d3a17",
  storageBucket: "lager-d3a17.firebasestorage.app",
  messagingSenderId: "332063299881",
  appId: "1:332063299881:web:d7aa8304b71785ec70ff38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore Datenbank
export const db = getFirestore(app);

export default app;
