import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAEYdD9VjsYVCSNOkrpXtXPyKwdChKJ4sQ",
  authDomain: "trinayaa-b6b4f.firebaseapp.com",
  projectId: "trinayaa-b6b4f",
  storageBucket: "trinayaa-b6b4f.firebasestorage.app",
  messagingSenderId: "493864970722",
  appId: "1:493864970722:web:14afe1323af2ccc4dff1bb",
  measurementId: "G-NVBDP47N9Q",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
