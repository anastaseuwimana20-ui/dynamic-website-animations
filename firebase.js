import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7RDM5zgdyNSg3fs06RKtAMXkWwc9_SJI",
  authDomain: "eav-gitwe-tss.firebaseapp.com",
  projectId: "eav-gitwe-tss",
  storageBucket: "eav-gitwe-tss.firebasestorage.app",
  messagingSenderId: "457038227189",
  appId: "1:457038227189:web:e929c5b758fee7c81487bc",
  measurementId: "G-VW0JSHB28Y"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
