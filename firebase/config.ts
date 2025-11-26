import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFmTMXvTYf911kW-XywBz5wtARu0xAFok",
  authDomain: "gunboojo.firebaseapp.com",
  projectId: "gunboojo",
  storageBucket: "gunboojo.appspot.com",
  messagingSenderId: "777746242989",
  appId: "1:777746242989:web:d2ed091504de935e359524",
  measurementId: "G-BCM6YZZJ4H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

console.log("Firebase initialized with project:", firebaseConfig.projectId);

export { auth, googleProvider, db, functions, storage, app };
