// firebase-init.js
//
// This is the ONE place Firebase gets set up. Every other page/script
// imports { db } from here instead of initializing Firebase again.
//
// HOW TO FILL THIS IN (do this first, before testing anything):
// 1. Go to https://console.firebase.google.com and create a new project
//    (free "Spark" plan is enough, no credit card needed).
// 2. Inside the project: click the Web icon (</>) to register a web app.
// 3. Firebase will show you a firebaseConfig object with real values.
//    Copy-paste those values below, replacing the placeholders.
// 4. In the left sidebar, go to Build -> Firestore Database -> Create database
//    (start in "production mode", we supply our own rules in firestore.rules).
//
// Nothing in this file is secret. The Firebase "apiKey" for a web app is
// not a password, it just identifies which Firebase project to talk to -
// access is actually controlled by firestore.rules. That's why this file
// is safe to commit to a public GitHub repo. (The service-account-key.json
// used by the Node.js script in /scripts is DIFFERENT and must NEVER be
// committed - see the root .gitignore.)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  connectFirestoreEmulator,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
   apiKey: "AIzaSyA9GQD0o6qU-hSoIJhxVR6hF7wViOUHLXk",
  authDomain: "project-0581f3ee-637c-4fd3-b5c.firebaseapp.com",
  projectId: "project-0581f3ee-637c-4fd3-b5c",
  storageBucket: "project-0581f3ee-637c-4fd3-b5c.firebasestorage.app",
  messagingSenderId: "212605168688",
  appId: "1:212605168688:web:b306b96b73cdea1a5d11f5",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection names used everywhere in this project, kept in one place
// so a typo doesn't silently create a new collection by accident.
export const LEADS_COLLECTION = "leads";
export const DEALERS_COLLECTION = "dealers";
