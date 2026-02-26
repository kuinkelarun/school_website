'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getDocument,
  getDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  subscribeToDocument,
  subscribeToCollection,
  type QueryConstraint,
  type WhereFilterOp,
} from '@/lib/firebase/firestore';

interface UseDocumentReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCollectionReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseMutationReturn<T> {
  mutate: (data: T) => Promise<string | void>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface UseUpdateMutationReturn<T> {
  mutate: (docId: string, data: Partial<T>) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface UseDeleteMutationReturn {
  mutate: (docId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Hook to fetch a single document
 */
export function useDocument<T>(
  collectionName: string,
  docId: string | null,
  realtime: boolean = false
): UseDocumentReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const doc = await getDocument<T>(collectionName, docId);
      setData(doc);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch document');
    } finally {
      setLoading(false);
    }
  }, [collectionName, docId]);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    if (realtime) {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToDocument<T>(collectionName, docId, (doc) => {
        setData(doc);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Fetch once
      fetchDocument();
    }
  }, [collectionName, docId, realtime, fetchDocument]);

  return {
    data,
    loading,
    error,
    refetch: fetchDocument,
  };
}

/**
 * Hook to fetch a collection of documents
 */
export function useCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  realtime: boolean = false
): UseCollectionReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to constraints so the effect/refetch always read the latest value
  // without needing the unstable array reference in dependency arrays.
  const constraintsRef = useRef(constraints);
  constraintsRef.current = constraints;

  // Create a stable string representation of constraints to track changes
  const constraintsStr = JSON.stringify(constraints);

  useEffect(() => {
    let mounted = true;

    const fetchDocuments = async () => {
      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);
        const docs = await getDocuments<T>(collectionName, constraintsRef.current);
        if (mounted) setData(docs);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to fetch documents');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (realtime) {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToCollection<T>(collectionName, constraintsRef.current, (docs) => {
        if (mounted) {
          setData(docs);
          setLoading(false);
        }
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    } else {
      // Fetch once
      fetchDocuments();
      return () => {
        mounted = false;
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, constraintsStr, realtime]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getDocuments<T>(collectionName, constraintsRef.current);
      setData(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, constraintsStr]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to query documents with filters
 */
export function useQueryDocuments<T>(
  collectionName: string,
  filters: { field: string; operator: WhereFilterOp; value: any }[] = [],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount?: number
): UseCollectionReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to filters so the effect/refetch always read the latest value
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const filtersStr = JSON.stringify(filters);

  useEffect(() => {
    let mounted = true;

    const fetchDocuments = async () => {
      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);
        const docs = await queryDocuments<T>(
          collectionName,
          filtersRef.current,
          orderByField,
          orderDirection,
          limitCount
        );
        if (mounted) setData(docs);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to query documents');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDocuments();
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, filtersStr, orderByField, orderDirection, limitCount]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await queryDocuments<T>(
        collectionName,
        filtersRef.current,
        orderByField,
        orderDirection,
        limitCount
      );
      setData(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to query documents');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, filtersStr, orderByField, orderDirection, limitCount]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to add a document
 */
export function useAddDocument<T>(collectionName: string): UseMutationReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(
    async (data: T): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);
        const docId = await addDocument<T>(collectionName, data);
        setSuccess(true);
        return docId;
      } catch (err: any) {
        setError(err.message || 'Failed to add document');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return {
    mutate,
    loading,
    error,
    success,
  };
}

/**
 * Hook to update a document
 */
export function useUpdateDocument<T>(collectionName: string): UseUpdateMutationReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(
    async (docId: string, data: Partial<T>): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);
        await updateDocument<Partial<T>>(collectionName, docId, data);
        setSuccess(true);
      } catch (err: any) {
        setError(err.message || 'Failed to update document');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return {
    mutate,
    loading,
    error,
    success,
  };
}

/**
 * Hook to delete a document
 */
export function useDeleteDocument(collectionName: string): UseDeleteMutationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(
    async (docId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);
        await deleteDocument(collectionName, docId);
        setSuccess(true);
      } catch (err: any) {
        setError(err.message || 'Failed to delete document');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return {
    mutate,
    loading,
    error,
    success,
  };
}
