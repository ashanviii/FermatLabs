// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCW3sLDeaWza0WqP_rFD_puA30DiLYUilo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fermat-9e38d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fermat-9e38d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fermat-9e38d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "935281059282",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:935281059282:web:8bfbad88ad6837c41a140b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ZQLJSNJYBM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// User query tracking functions
export interface UserData {
  email: string;
  displayName: string;
  photoURL: string;
  queryCount: number;
  isPro: boolean;
  createdAt: any;
  lastQueryAt: any;
}

const FREE_QUERY_LIMIT = 5;

export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const createUserDocument = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        queryCount: 0,
        isPro: false,
        createdAt: serverTimestamp(),
        lastQueryAt: null,
      });
    }
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

export const incrementQueryCount = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      queryCount: increment(1),
      lastQueryAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error incrementing query count:', error);
    throw error;
  }
};

export const canMakeQuery = async (uid: string): Promise<{ canQuery: boolean; remaining: number; isPro: boolean }> => {
  try {
    const userData = await getUserData(uid);
    
    if (!userData) {
      return { canQuery: false, remaining: 0, isPro: false };
    }
    
    if (userData.isPro) {
      return { canQuery: true, remaining: -1, isPro: true }; // -1 means unlimited
    }
    
    const remaining = FREE_QUERY_LIMIT - userData.queryCount;
    const canQuery = remaining > 0;
    
    return { canQuery, remaining, isPro: false };
  } catch (error) {
    console.error('Error checking query limit:', error);
    return { canQuery: false, remaining: 0, isPro: false };
  }
};

export const upgradeToPro = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isPro: true,
    });
  } catch (error) {
    console.error('Error upgrading to pro:', error);
    throw error;
  }
};

export { analytics };
export default app;