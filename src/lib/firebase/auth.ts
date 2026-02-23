import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
  type UserCredential,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<UserCredential> {
  try {
    // Set persistence based on remember me option
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Check if user is an admin
    const adminUser = await getAdminUser(userCredential.user.uid);

    if (!adminUser || !adminUser.isActive) {
      await firebaseSignOut(auth);
      throw new Error('Access denied. You do not have admin privileges.');
    }

    return userCredential;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get admin user data from Firestore
 */
export async function getAdminUser(userId: string): Promise<any | null> {
  try {
    const userDoc = await getDoc(doc(db, 'adminUsers', userId));

    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }

    return null;
  } catch (error) {
    console.error('Error fetching admin user:', error);
    return null;
  }
}

/**
 * Check if current user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Get current user ID token
 */
export async function getUserIdToken(): Promise<string | null> {
  const user = getCurrentUser();
  if (user) {
    return await user.getIdToken();
  }
  return null;
}
