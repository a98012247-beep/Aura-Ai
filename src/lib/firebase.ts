import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  addDoc 
} from "firebase/firestore";

import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);


// @ts-ignore
if (typeof window !== "undefined") {
  // @ts-ignore
  window.db = db;
}

export const signUp = async (name: string, phone: string, email: string, pass: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      try {
        await updateProfile(result.user, { displayName: name });
      } catch (pErr) {
        console.warn("Could not set displayName:", pErr);
      }

      const isAdminEmail = (email || '').toLowerCase() === 'a98012247@gmail.com';
      await setDoc(doc(db, 'members', result.user.uid), {
        uid: result.user.uid,
        name: name || '',
        email: result.user.email,
        phone: phone || '',
        role: isAdminEmail ? 'admin' : 'free',
        status: 'active',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    }
    return result.user;
  } catch (error: any) {
    console.error("Error signing up", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please switch to Sign In.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters.');
    }
    throw error;
  }
};

export const logIn = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      const memberRef = doc(db, 'members', result.user.uid);
      const snap = await getDoc(memberRef);

      const isAdminEmail = (result.user.email || '').toLowerCase() === 'a98012247@gmail.com';
      if (!snap.exists()) {
        await setDoc(memberRef, {
          uid: result.user.uid,
          name: result.user.displayName || email.split('@')[0],
          email: result.user.email,
          phone: '',
          role: isAdminEmail ? 'admin' : 'free',
          status: 'active',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
      } else {
        const updatePayload: any = {
          lastLoginAt: serverTimestamp()
        };
        if (isAdminEmail && snap.data().role !== 'admin') {
          updatePayload.role = 'admin';
        }
        await setDoc(memberRef, updatePayload, { merge: true });
      }
    }
    return result.user;
  } catch (error: any) {
    console.error("Error signing in", error);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Incorrect email or password. Please verify your credentials or click Register to create a simple account.');
    }
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const googleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      const memberRef = doc(db, 'members', result.user.uid);
      const snap = await getDoc(memberRef);

      if (!snap.exists()) {
        await setDoc(memberRef, {
          uid: result.user.uid,
          name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          email: result.user.email,
          phone: '',
          role: 'free',
          status: 'active',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
      } else {
        await setDoc(memberRef, {
          lastLoginAt: serverTimestamp()
        }, { merge: true });
      }
    }
    return result.user;
  } catch (error: any) {
    console.error("Error with Google Sign-In", error);
    throw new Error('Google Sign-In failed. Please try again.');
  }
};

export { onAuthStateChanged };
