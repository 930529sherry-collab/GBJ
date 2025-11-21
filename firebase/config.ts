
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAFmTMXvTYf911kW-XywBz5wtARu0xAFok",
  authDomain: "gunboojo.firebaseapp.com",
  projectId: "gunboojo",
  storageBucket: "gunboojo.firebasestorage.app",
  messagingSenderId: "777746242989",
  appId: "1:777746242989:web:d2ed091504de935e359524",
  measurementId: "G-BCM6YZZJ4H"
};

// Initialize Firebase
// Check if firebase apps are already initialized to prevent errors
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();
const googleProvider = new firebase.auth.GoogleAuthProvider();

console.log("Firebase initialized with project:", firebaseConfig.projectId);

export { auth, googleProvider, db, functions };
export default firebase;
