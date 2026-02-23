'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getDocuments<T>(collectionName, constraints);
      setData(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [collectionName, constraints]);

  useEffect(() => {
    if (realtime) {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToCollection<T>(collectionName, constraints, (docs) => {
        setData(docs);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Fetch once
      fetchDocuments();
    }
  }, [collectionName, realtime, fetchDocuments]);

  return {
    data,
    loading,
    error,
    refetch: fetchDocuments,
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

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await queryDocuments<T>(
        collectionName,
        filters,
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
  }, [collectionName, filters, orderByField, orderDirection, limitCount]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    data,
    loading,
    error,
    refetch: fetchDocuments,
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
export function useUpdateDocument<T>(collectionName: string): UseMutationReturn<T> {
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
  ) as any;

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
export function useDeleteDocument(collectionName: string): UseMutationReturn<string> {
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
  ) as any;

  return {
    mutate,
    loading,
    error,
    success,
  };
}
