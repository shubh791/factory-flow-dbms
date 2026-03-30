'use client';
/**
 * useProduction — centralized production records + products hook.
 *
 * Features:
 *  - Instant display from cache (zero flicker on revisit)
 *  - Auto-refresh every 10 s (same as original)
 *  - Optimistic add / update / delete with rollback
 *  - Cross-component sync via cache invalidation
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import API from '@/lib/api';
import * as C from '@/lib/cache';

const K_PROD = 'production';
const K_PRDT = 'products';
const K_EMP  = 'employees';
const TTL    = 15_000; // 15 s (shorter for live data)

export function useProduction() {
  const [records,  setRecords]  = useState(() => C.get(K_PROD) ?? []);
  const [products, setProducts] = useState(() => C.get(K_PRDT) ?? []);
  const [employees,setEmployees]= useState(() => C.get(K_EMP)  ?? []);
  const [loading,  setLoading]  = useState(!C.get(K_PROD));
  const [error,    setError]    = useState('');
  const mounted = useRef(true);

  /* ── Fetch production records ─────────────────────────────────── */
  const fetchRecords = useCallback(async (force = false) => {
    if (!force && C.get(K_PROD)) return;
    try {
      await C.dedup('production-fetch', async () => {
        const res = await API.get(`/production?t=${Date.now()}`);
        const data = Array.isArray(res.data) ? res.data : [];
        C.set(K_PROD, data, TTL, ['production']);
        if (mounted.current) setRecords(data);
      });
    } catch {
      if (mounted.current) setError('Failed to load production records');
    }
  }, []);

  /* ── Initial load + reference data ───────────────────────────── */
  useEffect(() => {
    mounted.current = true;

    const init = async () => {
      setLoading(true);
      try {
        const fetches = [fetchRecords(true)];
        if (!C.get(K_PRDT)) fetches.push(
          API.get('/products').then((r) => {
            const d = Array.isArray(r.data) ? r.data : [];
            C.set(K_PRDT, d, 120_000, ['products']);
            if (mounted.current) setProducts(d);
          })
        );
        if (!C.get(K_EMP)) fetches.push(
          API.get(`/employees?t=${Date.now()}`).then((r) => {
            const d = Array.isArray(r.data) ? r.data : [];
            C.set(K_EMP, d, 30_000, ['employees']);
            if (mounted.current) setEmployees(d);
          })
        );
        await Promise.all(fetches);
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    init();

    // Hydrate from cache if already populated
    const cached = C.get(K_PRDT);
    if (cached) setProducts(cached);
    const cachedEmp = C.get(K_EMP);
    if (cachedEmp) setEmployees(cachedEmp);

    // Auto-refresh every 10 s
    const interval = setInterval(() => fetchRecords(true), 10_000);

    // Subscribe to external invalidation
    const unsub = C.subscribe(K_PROD, () => {
      const fresh = C.get(K_PROD);
      if (fresh && mounted.current) setRecords(fresh);
      else fetchRecords(true);
    });

    return () => {
      mounted.current = false;
      clearInterval(interval);
      unsub();
    };
  }, [fetchRecords]);

  /* ── Optimistic ADD ──────────────────────────────────────────── */
  const addRecord = useCallback(async (data) => {
    const tempId    = `_opt_${Date.now()}`;
    const product   = products.find((p) => p.id === Number(data.productId));
    const employee  = employees.find((e) => e.id === Number(data.employeeId));
    const optimistic = {
      id: tempId,
      units:      Number(data.units)   || 0,
      defects:    Number(data.defects) || 0,
      productId:  Number(data.productId),
      employeeId: Number(data.employeeId),
      product,
      employee,
      productionDate: new Date().toISOString(),
      _optimistic: true,
    };
    setRecords((prev) => [optimistic, ...prev]);
    try {
      await API.post('/production', {
        units:      Number(data.units),
        defects:    Number(data.defects),
        productId:  Number(data.productId),
        employeeId: Number(data.employeeId),
      });
      C.invalidate(K_PROD);
      await fetchRecords(true);
    } catch (err) {
      setRecords((prev) => prev.filter((r) => r.id !== tempId));
      throw err;
    }
  }, [products, employees, fetchRecords]);

  /* ── Optimistic UPDATE ───────────────────────────────────────── */
  const updateRecord = useCallback(async (id, data) => {
    const snapshot = records.find((r) => r.id === id);
    setRecords((prev) => prev.map((r) =>
      r.id === id ? { ...r, ...data } : r
    ));
    try {
      await API.patch(`/production/${id}`, data);
      C.invalidate(K_PROD);
      await fetchRecords(true);
    } catch (err) {
      if (snapshot) setRecords((prev) => prev.map((r) => r.id === id ? snapshot : r));
      throw err;
    }
  }, [records, fetchRecords]);

  /* ── Optimistic DELETE ───────────────────────────────────────── */
  const deleteRecord = useCallback(async (id) => {
    const removed = records.find((r) => r.id === id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    try {
      await API.delete(`/production/${id}`);
      C.invalidate(K_PROD);
    } catch (err) {
      if (removed) setRecords((prev) => [removed, ...prev]);
      throw err;
    }
  }, [records]);

  /* ── Clear all ───────────────────────────────────────────────── */
  const clearAll = useCallback(async () => {
    const backup = [...records];
    setRecords([]);
    try {
      const res = await API.delete('/production/clear');
      C.invalidate(K_PROD);
      return res.data;
    } catch (err) {
      setRecords(backup);
      throw err;
    }
  }, [records]);

  /* ── Upload CSV ──────────────────────────────────────────────── */
  const uploadCSV = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await API.post('/production-upload/upload-production-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    C.invalidate(K_PROD);
    await fetchRecords(true);
    return res.data;
  }, [fetchRecords]);

  return {
    records,
    products,
    employees,
    loading,
    error,
    refresh:      () => fetchRecords(true),
    addRecord,
    updateRecord,
    deleteRecord,
    clearAll,
    uploadCSV,
  };
}
