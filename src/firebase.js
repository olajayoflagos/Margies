// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Replace this with your actual Firebase config from the console
const firebaseConfig = {
  apiKey: "AIzaSyBzuwvyNJKivxBUakyPUKIzpRpk47p8NVU",
  authDomain: "my-hotel-contact.firebaseapp.com",
  projectId: "my-hotel-contact",
  storageBucket: "my-hotel-contact.appspot.com",
  messagingSenderId: "908176355021",
  appId: "1:908176355021:web:6c3b8978d87790fc5fc384"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
