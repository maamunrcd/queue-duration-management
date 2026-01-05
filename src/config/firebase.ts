// Firebase Configuration Example
// Copy this file to firebase.ts and add your Firebase config

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Replace with your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAOH1zAPWv8hcYMbNz8YDnZMhXOSEKm6oU",
  authDomain: "queue-pilot-a2993.firebaseapp.com",
  databaseURL:
    "https://queue-pilot-a2993-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "queue-pilot-a2993",
  storageBucket: "queue-pilot-a2993.firebasestorage.app",
  messagingSenderId: "97001504016",
  appId: "1:97001504016:web:b396374b74c7592474f995",
  measurementId: "G-059PKSD50M",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
