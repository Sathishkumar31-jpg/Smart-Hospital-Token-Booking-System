// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔥 YOUR FIREBASE CONFIG (CONSOLE-LA IRUNDHU COPY)
const firebaseConfig = {
  apiKey:"AIzaSyAOxKFQPOspgRowd8AH5qJlMn6GzDv-Y1w",
  authDomain: "smartqueue-eb097.firebaseapp.com",
  projectId: "smartqueue-eb097",
  storageBucket: "smartqueue-eb097.firebasestorage.app",
  messagingSenderId: "699275672772",
  appId: "1:699275672772:web:68a424f4d19cf2f412dd91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth & db
export const auth = getAuth(app);
export const db = getFirestore(app);
