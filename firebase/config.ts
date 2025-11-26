// @-fix: Switched to firebase/compat imports to resolve "no exported member" errors.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/functions";
import "firebase/compat/storage";

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
// @-fix: Use compat initialization to align with the rest of the app's apparent V8 syntax usage.
let app: firebase.app.App;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app();
}

// @-fix: Use compat types for auth, db, functions, and storage to match the V8 syntax used throughout the app.
const auth: firebase.auth.Auth = firebase.auth();
const db: firebase.firestore.Firestore = firebase.firestore();
const functions: firebase.functions.Functions = firebase.functions();
const storage: firebase.storage.Storage = firebase.storage();
const googleProvider = new firebase.auth.GoogleAuthProvider();

console.log("Firebase initialized with project:", firebaseConfig.projectId);

export { auth, googleProvider, db, functions, storage, app };