import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBU9HglHR6o7kocD8pty4_SU6KbVEZssOw",
  authDomain: "lowdapp-marketing.firebaseapp.com",
  projectId: "lowdapp-marketing",
  storageBucket: "lowdapp-marketing.firebasestorage.app",
  messagingSenderId: "828891266092",
  appId: "1:828891266092:web:a4bf2e25132ed7123aa589",
  measurementId: "G-57PBT9LWXV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export default app;