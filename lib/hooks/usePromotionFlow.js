'use client';
/**
 * usePromotionFlow — hierarchy-aware promotion management hook.
 *
 * Rules enforced:
 *  1. Only roles with a LOWER level number (= higher rank) are valid targets.
 *     (level 1 = top management; higher number = lower rank)
 *  2. Same role is never shown.
 *  3. If the employee is already at the highest role, CTA is disabled.
 *  4. Optimistic promotion → instant history + employee table update.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import API from '@/lib/api';
import * as C from '@/lib/cache';

const K_EMP   = 'employees';
const K_ROLES = 'roles';
const K_PROMO = 'promotions';
const TTL     = 30_000;

export function usePromotionFlow() {
  const [employees,  setEmployees]  = useState(() => C.get(K_EMP)   ?? []);
  const [roles,      setRoles]      = useState(() => C.get(K_ROLES)  ?? []);
  const [promotions, setPromotions] = useState(() => C.get(K_PROMO)  ?? []);
  const [loading,    setLoading]    = useState(!C.get(K_EMP));
  const mounted = useRef(true);

  /* ── Initial fetch ──────────────────────────────────────────── */
  const fetchAll = useCallback(async (force = false) => {
    if (!force && C.get(K_EMP) && C.get(K_PROMO)) return;
    setLoading(true);
    try {
      const [empRes, roleRes, promoRes] = await Promise.all([
        API.get(`/employees?t=${Date.now()}`),
        API.get('/roles'),
        API.get('/promotions'),
      ]);
      const emp   = Array.isArray(empRes.data)   ? empRes.data   : [];
      const role  = Array.isArray(roleRes.data)  ? roleRes.data  : [];
      const promo = Array.isArray(promoRes.data) ? promoRes.data : [];
      C.set(K_EMP,   emp,   TTL, ['employees']);
      C.set(K_ROLES, role,  TTL, ['roles']);
      C.set(K_PROMO, promo, TTL, ['promotions']);
      if (mounted.current) {
        setEmployees(emp);
        setRoles(role);
        setPromotions(promo);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchAll();
    const unsub = C.subscribe(K_PROMO, () => fetchAll(true));
    return () => { mounted.current = false; unsub(); };
  }, [fetchAll]);

  /* ── Valid promotion targets for a given employee ───────────── */
  const getValidRoles = useCallback((employee) => {
    if (!employee) return [];
    const currentLevel = employee.role?.level ?? Infinity;
    // Lower level number = higher position; only allow moving UP (lower number)
    return roles
      .filter((r) => r.level < currentLevel)
      .sort((a, b) => a.level - b.level);
  }, [roles]);

  /* ── Is employee already at highest role? ───────────────────── */
  const isAtTopRole = useCallback((employee) => {
    if (!employee || !roles.length) return false;
    const minLevel = Math.min(...roles.map((r) => r.level));
    return employee.role?.level === minLevel;
  }, [roles]);

  /* ── Optimistic PROMOTE ─────────────────────────────────────── */
  const promote = useCallback(async ({ employeeId, newRoleId, remarks }) => {
    const employee = employees.find((e) => e.id === Number(employeeId));
    const newRole  = roles.find((r) => r.id === Number(newRoleId));
    if (!employee || !newRole) throw new Error('Invalid employee or role');

    // Validate hierarchy before sending
    if (newRole.level >= (employee.role?.level ?? Infinity)) {
      throw new Error('Target role must be a higher position (lower level number)');
    }

    // Optimistic: update employee's role in cache
    const updatedEmp = { ...employee, roleId: newRole.id, role: newRole };
    setEmployees((prev) => prev.map((e) => e.id === employee.id ? updatedEmp : e));

    // Optimistic: prepend to history
    const tempPromo = {
      id:          `_opt_${Date.now()}`,
      employeeId:  employee.id,
      employee,
      oldRoleId:   employee.roleId,
      newRoleId:   newRole.id,
      oldRole:     employee.role,
      newRole,
      remarks:     remarks || null,
      promotedAt:  new Date().toISOString(),
      _optimistic: true,
    };
    setPromotions((prev) => [tempPromo, ...prev]);

    try {
      const res = await API.post('/promotions', {
        employeeId: Number(employeeId),
        newRoleId:  Number(newRoleId),
        remarks,
      });
      // Refresh real data
      C.invalidate(K_EMP, K_PROMO);
      await fetchAll(true);
      return res.data;
    } catch (err) {
      // Rollback
      setEmployees((prev) => prev.map((e) => e.id === employee.id ? employee : e));
      setPromotions((prev) => prev.filter((p) => p.id !== tempPromo.id));
      throw err;
    }
  }, [employees, roles, fetchAll]);

  return {
    employees,
    roles,
    promotions,
    loading,
    refresh:       () => fetchAll(true),
    getValidRoles,
    isAtTopRole,
    promote,
  };
}
