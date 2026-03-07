import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  type User,
  type UserCredential,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
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

// ============================================================================
// Faculty Auth
// ============================================================================

/**
 * Get faculty user data from Firestore
 */
export async function getFacultyUser(userId: string): Promise<any | null> {
  try {
    const userDoc = await getDoc(doc(db, 'facultyUsers', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching faculty user:', error);
    return null;
  }
}

/**
 * Sign in as faculty member
 */
export async function facultySignIn(
  email: string,
  password: string
): Promise<{ user: UserCredential; facultyUser: any }> {
  try {
    await setPersistence(auth, browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    const facultyUser = await getFacultyUser(userCredential.user.uid);
    if (!facultyUser) {
      await firebaseSignOut(auth);
      throw new Error('No faculty account found for this email.');
    }
    if (!facultyUser.isActive) {
      await firebaseSignOut(auth);
      throw new Error('Your faculty account has been deactivated.');
    }
    if (!facultyUser.isApproved) {
      await firebaseSignOut(auth);
      throw new Error('Your account is pending admin approval.');
    }

    return { user: userCredential, facultyUser };
  } catch (error: any) {
    console.error('Faculty sign in error:', error);
    throw error;
  }
}

/**
 * Register a new faculty portal account.
 * Validates that the email belongs to an existing faculty member.
 */
export async function facultyRegister(
  email: string,
  password: string,
  fullName: string
): Promise<void> {
  // Create Firebase Auth user first so we're authenticated for the faculty query
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  try {
    // Check if email matches an existing faculty member
    const facultyQuery = query(
      collection(db, 'faculty'),
      where('email', '==', email)
    );
    const facultySnap = await getDocs(facultyQuery);

    if (facultySnap.empty) {
      // Roll back: delete the auth user since they're not in faculty records
      await userCredential.user.delete();
      throw new Error('Email not found in faculty records. Only current faculty members can register.');
    }

    const facultyDoc = facultySnap.docs[0];

    // Create facultyUsers document
    await setDoc(doc(db, 'facultyUsers', userCredential.user.uid), {
      email,
      fullName,
      facultyMemberId: facultyDoc.id,
      isApproved: false,
      isActive: true,
      storageUsed: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // If anything fails after user creation, sign out
    await firebaseSignOut(auth);
    throw error;
  }

  // Sign out immediately — they can't use the portal until approved
  await firebaseSignOut(auth);
}
