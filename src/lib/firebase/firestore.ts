import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type Query,
  type DocumentData,
  type QueryConstraint,
  Timestamp,
  serverTimestamp,
  type WhereFilterOp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';

export type { QueryConstraint, WhereFilterOp };

// ─── Bypass localStorage store (no Firebase needed) ──────────────────────────
const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

function bpKey(col: string) { return `bypass_${col}`; }

function bpGetAll(col: string): any[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(bpKey(col)) || '[]'); } catch { return []; }
}

function bpSave(col: string, docs: any[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(bpKey(col), JSON.stringify(docs));
}

function bpAdd(col: string, data: any): string {
  const docs = bpGetAll(col);
  const id = `bp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  // strip any serverTimestamp sentinels (they stringify as {})
  const clean = JSON.parse(JSON.stringify({ ...data, id, createdAt: now, updatedAt: now }));
  docs.unshift(clean); // newest first
  bpSave(col, docs);
  return id;
}

function bpUpdate(col: string, id: string, data: any) {
  const docs = bpGetAll(col).map((d) =>
    d.id === id ? { ...d, ...JSON.parse(JSON.stringify(data)), updatedAt: new Date().toISOString() } : d
  );
  bpSave(col, docs);
}

function bpDelete(col: string, id: string) {
  bpSave(col, bpGetAll(col).filter((d) => d.id !== id));
}

function bpGet(col: string, id: string): any | null {
  return bpGetAll(col).find((d) => d.id === id) ?? null;
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a single document by ID
 */
export async function getDocument<T = DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  if (BYPASS) return bpGet(collectionName, docId) as T | null;
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get all documents from a collection with optional filters
 */
export async function getDocuments<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  if (BYPASS) return bpGetAll(collectionName) as T[];
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Add a new document to a collection
 */
export async function addDocument<T = DocumentData>(
  collectionName: string,
  data: T
): Promise<string> {
  if (BYPASS) return bpAdd(collectionName, data);
  try {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, collectionName), docData);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update an existing document
 */
export async function updateDocument<T = Partial<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  if (BYPASS) { bpUpdate(collectionName, docId, data); return; }
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Set (create or overwrite) a document with a specific ID
 */
export async function setDocument<T = DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  if (BYPASS) {
    // Upsert: remove existing then prepend
    const docs = bpGetAll(collectionName).filter((d) => d.id !== docId);
    const now = new Date().toISOString();
    const clean = JSON.parse(JSON.stringify({ ...data, id: docId, createdAt: now, updatedAt: now }));
    docs.unshift(clean);
    bpSave(collectionName, docs);
    return;
  }
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  if (BYPASS) { bpDelete(collectionName, docId); return; }
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Query documents with filters
 */
export async function queryDocuments<T = DocumentData>(
  collectionName: string,
  filters: { field: string; operator: WhereFilterOp; value: any }[] = [],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount?: number
): Promise<T[]> {
  if (BYPASS) {
    let docs = bpGetAll(collectionName);

    // Coerce a stored value or filter value to a comparable primitive.
    // Handles: Date objects, ISO strings, Firestore-style {seconds, nanoseconds} objects, and plain numbers.
    const coerce = (v: any): any => {
      if (v == null) return v;
      if (v instanceof Date) return v.getTime();
      if (typeof v === 'object' && 'seconds' in v)
        return v.seconds * 1000 + (v.nanoseconds || 0) / 1e6;
      if (typeof v === 'string') {
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d.getTime();
      }
      return v;
    };

    // Apply each filter in-memory
    for (const f of filters) {
      docs = docs.filter((doc) => {
        const val = doc[f.field];
        switch (f.operator) {
          case '==': {
            // Strict match first, then handle boolean/string coercion
            if (val === f.value) return true;
            if (typeof f.value === 'boolean') return val === String(f.value) || (f.value === true && val === 1) || (f.value === false && val === 0);
            return false;
          }
          case '!=': {
            if (val !== f.value) {
              if (typeof f.value === 'boolean') return val !== String(f.value);
              return true;
            }
            return false;
          }
          case '>':  return coerce(val) > coerce(f.value);
          case '>=': return coerce(val) >= coerce(f.value);
          case '<':  return coerce(val) < coerce(f.value);
          case '<=': return coerce(val) <= coerce(f.value);
          case 'in': return Array.isArray(f.value) && f.value.includes(val);
          case 'not-in': return Array.isArray(f.value) && !f.value.includes(val);
          case 'array-contains': return Array.isArray(val) && val.includes(f.value);
          default: return true;
        }
      });
    }

    // Sort by orderByField
    if (orderByField) {
      // Helper: coerce stored values (ISO strings, Firestore Timestamp objects, numbers) to ms
      const toMs = (v: any): number => {
        if (v == null) return 0;
        if (typeof v === 'object' && 'seconds' in v) return v.seconds * 1000 + (v.nanoseconds || 0) / 1e6;
        if (typeof v === 'string') return new Date(v).getTime();
        return Number(v);
      };
      docs.sort((a, b) => {
        const diff = toMs(a[orderByField]) - toMs(b[orderByField]);
        return orderDirection === 'asc' ? diff : -diff;
      });
    }

    if (limitCount) docs = docs.slice(0, limitCount);
    return docs as T[];
  }

  try {
    const collectionRef = collection(db, collectionName);
    const constraints: QueryConstraint[] = [];

    // Add where clauses
    filters.forEach((filter) => {
      constraints.push(where(filter.field, filter.operator, filter.value));
    });

    // Add orderBy
    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection));
    }

    // Add limit
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get paginated documents
 */
export async function getPaginatedDocuments<T = DocumentData>(
  collectionName: string,
  pageSize: number,
  lastDoc?: any,
  orderByField: string = 'createdAt',
  orderDirection: 'asc' | 'desc' = 'desc',
  filters: QueryConstraint[] = []
): Promise<{ documents: T[]; lastDoc: any }> {
  try {
    const collectionRef = collection(db, collectionName);
    const constraints: QueryConstraint[] = [
      ...filters,
      orderBy(orderByField, orderDirection),
      limit(pageSize),
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    return {
      documents,
      lastDoc: lastVisible,
    };
  } catch (error) {
    console.error(`Error getting paginated documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates for a document
 */
export function subscribeToDocument<T = DocumentData>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, docId);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as T);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error(`Error subscribing to document in ${collectionName}:`, error);
    }
  );
}

/**
 * Subscribe to real-time updates for a collection
 */
export function subscribeToCollection<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe {
  if (BYPASS) {
    callback(bpGetAll(collectionName) as T[]);
    return () => {};
  }
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...constraints);

  return onSnapshot(
    q,
    (querySnapshot) => {
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
      callback(documents);
    },
    (error) => {
      console.error(`Error subscribing to collection ${collectionName}:`, error);
    }
  );
}

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * Convert Date to Firestore Timestamp
 */
export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}
