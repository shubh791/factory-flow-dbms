'use client';
/**
 * useEmployees — centralized employees + departments + roles hook.
 *
 * Features:
 *  - Instant display from cache on mount (zero flicker)
 *  - Deduplicated in-flight requests (multiple components → 1 fetch)
 *  - Optimistic CRUD (add/update/delete feel instant, rollback on error)
 *  - Cross-component sync via cache subscriber
 *  - Stable function references (useCallback)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import API from '@/lib/api';
import * as C from '@/lib/cache';

const K_EMP  = 'employees';
const K_DEPT = 'departments';
const K_ROLE = 'roles';
const TTL    = 30_000; // 30 s

export function useEmployees() {
  const [employees,   setEmployees]   = useState(() => C.get(K_EMP)  ?? []);
  const [departments, setDepartments] = useState(() => C.get(K_DEPT) ?? []);
  const [roles,       setRoles]       = useState(() => C.get(K_ROLE) ?? []);
  const [loading,     setLoading]     = useState(!C.get(K_EMP));
  const [error,       setError]       = useState('');
  const mounted = useRef(true);

  /* ── Core fetch ──────────────────────────────────────────────── */
  const fetchAll = useCallback(async (force = false) => {
    if (!force && C.get(K_EMP)) return; // still fresh
    setLoading(true);
    try {
      await C.dedup('employees-fetch', async () => {
        const [empRes, deptRes, roleRes] = await Promise.all([
          API.get(`/employees?t=${Date.now()}`),
          API.get('/departments'),
          API.get('/roles'),
        ]);
        const emp  = Array.isArray(empRes.data)  ? empRes.data  : [];
        const dept = Array.isArray(deptRes.data) ? deptRes.data : [];
        const role = Array.isArray(roleRes.data) ? roleRes.data : [];
        C.set(K_EMP,  emp,  TTL, ['employees']);
        C.set(K_DEPT, dept, TTL, ['departments']);
        C.set(K_ROLE, role, TTL, ['roles']);
        if (mounted.current) {
          setEmployees(emp);
          setDepartments(dept);
          setRoles(role);
        }
      });
    } catch {
      if (mounted.current) setError('Failed to load employees');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  /* ── Subscribe to external cache invalidation ───────────────── */
  useEffect(() => {
    mounted.current = true;
    fetchAll();

    const rehydrate = () => {
      const fresh = C.get(K_EMP);
      if (fresh) setEmployees(fresh);
      else fetchAll(true);
    };
    const unsub = C.subscribe(K_EMP, rehydrate);
    return () => { mounted.current = false; unsub(); };
  }, [fetchAll]);

  /* ── Optimistic ADD ──────────────────────────────────────────── */
  const addEmployee = useCallback(async (data) => {
    const tempId    = `_opt_${Date.now()}`;
    const optimistic = {
      id:         tempId,
      ...data,
      experience: Number(data.experience) || 0,
      department: departments.find((d) => d.id === Number(data.departmentId)) ?? null,
      role:       roles.find((r)       => r.id === Number(data.roleId))       ?? null,
      _optimistic: true,
    };
    setEmployees((prev) => [optimistic, ...prev]);
    try {
      const res = await API.post('/employees', {
        ...data,
        departmentId: Number(data.departmentId),
        roleId:       Number(data.roleId),
        experience:   Number(data.experience) || 0,
      });
      C.invalidate(K_EMP);
      await fetchAll(true);
      return res.data;
    } catch (err) {
      setEmployees((prev) => prev.filter((e) => e.id !== tempId));
      throw err;
    }
  }, [departments, roles, fetchAll]);

  /* ── Optimistic UPDATE ───────────────────────────────────────── */
  const updateEmployee = useCallback(async (id, data) => {
    const snapshot = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.map((e) =>
      e.id === id ? { ...e, ...data } : e
    ));
    try {
      await API.patch(`/employees/${id}`, data);
      C.invalidate(K_EMP);
      await fetchAll(true);
    } catch (err) {
      if (snapshot) setEmployees((prev) => prev.map((e) => e.id === id ? snapshot : e));
      throw err;
    }
  }, [employees, fetchAll]);

  /* ── Optimistic DELETE ───────────────────────────────────────── */
  const deleteEmployee = useCallback(async (id) => {
    const removed = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    try {
      await API.delete(`/employees/${id}`);
      C.invalidate(K_EMP);
    } catch (err) {
      if (removed) setEmployees((prev) => [...prev, removed].sort((a, b) => a.id - b.id));
      throw err;
    }
  }, [employees]);

  /* ── Clear all with optimistic ───────────────────────────────── */
  const clearAll = useCallback(async () => {
    const backup = [...employees];
    setEmployees([]);
    try {
      const res = await API.delete('/employees/clear');
      C.invalidate(K_EMP);
      return res.data;
    } catch (err) {
      setEmployees(backup);
      throw err;
    }
  }, [employees]);

  /* ── Upload CSV ──────────────────────────────────────────────── */
  const uploadCSV = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await API.post('/employee-upload/upload-employees', formData);
    C.invalidate(K_EMP);
    await fetchAll(true);
    return res.data;
  }, [fetchAll]);

  return {
    employees,
    departments,
    roles,
    loading,
    error,
    refresh:         () => fetchAll(true),
    addEmployee,
    updateEmployee,
    deleteEmployee,
    clearAll,
    uploadCSV,
  };
}
