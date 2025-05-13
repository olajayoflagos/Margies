// src/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import getAuth
import { getFunctions } from "firebase/functions"; // Import getFunctions
// ... import other services like getStorage, etc.

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCRlOlAYLgKxC8yaYWn6y0k0SzDKYiDTnM",
  authDomain: "margies.firebaseapp.com",
  projectId: "margies",
  storageBucket: "margies.firebasestorage.app",
  messagingSenderId: "659149044191",
  appId: "1:659149044191:web:c593cbb2d334dec8d5ec6a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get and Export the initialized services
const db = getFirestore(app);
const auth = getAuth(app); // Get auth instance from the initialized app
const functions = getFunctions(app); // Get functions instance from the initialized app
// export const storage = getStorage(app); // Uncomment and get storage if you use it

export { app, db, auth, functions /* ... export other services */ };
