// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, updateDoc, getDoc, where, query, getDocs, addDoc, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Transaction } from '@/types/transaction';

// Firebase configuration with the provided credentials
const firebaseConfig = {
  apiKey: "AIzaSyDmbFLZiM_K-HNkoGhWjP4R3BrhQ-wtxAU",
  authDomain: "bytebill-96de7.firebaseapp.com",
  projectId: "bytebill-96de7",
  storageBucket: "bytebill-96de7.firebasestorage.app",
  messagingSenderId: "238074188673",
  appId: "1:238074188673:web:bf8f7757ba8d63a1cfce80",
  measurementId: "G-4MKT4ET2YW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('The current browser does not support persistence.');
    }
  });
} catch (error) {
  console.warn('Failed to enable persistence:', error);
}

// Export the Firebase authentication functions
export const signIn = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logOut = () => {
  return signOut(auth);
};

// Export Firestore helper functions
export const createUserProfile = async (userId: string, userData: any) => {
  try {
    return await setDoc(doc(db, "users", userId), {
      ...userData,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile. Please try again.');
  }
};

export const getUserTransactions = async (userId: string) => {
  try {
    const q = query(collection(db, "transactions"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        amount: data.amount,
        description: data.description,
        category: data.category,
        date: data.date,
        isExpense: data.isExpense,
        receiptUrl: data.receiptUrl,
        merchant: data.merchant,
        items: data.items,
        currency: data.currency || 'USD' // Default to USD if not specified
      });
    });
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch transactions. Please try again.');
  }
};

// Export Storage helper functions
export const uploadFile = (path: string, file: File) => {
  const storageRef = ref(storage, path);
  return uploadBytes(storageRef, file);
};

export const getFileUrl = (path: string) => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};

export const addTransaction = async (transactionData: {
  description: string;
  amount: number;
  category: string;
  date: string;
  merchant: string;
  notes: string;
  isExpense: boolean;
  currency: string;
}) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User is not authenticated');
    }

    const transactionsRef = collection(db, 'transactions');
    await addDoc(transactionsRef, {
      userId,
      ...transactionData,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw new Error('Failed to add transaction. Please try again.');
  }
};
