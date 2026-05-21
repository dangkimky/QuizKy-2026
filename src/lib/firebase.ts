import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key-for-prerender-build-purposes",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-project-id.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-project-id.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000",
};

let app: any;
let auth: any;
const googleProvider = new GoogleAuthProvider();

try {
  // Initialize Firebase client-side safely
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
} catch (err) {
  console.error("Firebase Initialization Safe-Guard caught an error during boot:", err);
  
  // Safe mock object to prevent SSR or blocking crashes
  app = {} as any;
  auth = {
    onAuthStateChanged: () => {
      console.warn("Firebase Auth fallback onAuthStateChanged active.");
      return () => {};
    },
    signOut: async () => {
      console.warn("Firebase Auth fallback signOut called.");
    }
  } as any;
}

export { app, auth, googleProvider };
export default app;
