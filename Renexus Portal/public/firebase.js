// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

 const firebaseConfig = {
  apiKey: "AIzaSyBdSf-IWCVvG9SeIrJAqmg07uNg2so9z3w",
  authDomain: "login-21ccb.firebaseapp.com",
  projectId: "login-21ccb",
  storageBucket: "login-21ccb.firebasestorage.app",
  messagingSenderId: "131781310389",
  appId: "1:131781310389:web:440d9672082e6163894bfc",
  measurementId: "G-WD4JC25671"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
