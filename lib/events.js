'use client';
/**
 * lib/events.js — Lightweight in-process event bus for real-time cross-page sync.
 *
 * Usage:
 *   import { emit, on, DataEvents } from '@/lib/events';
 *
 *   // Emit after a mutation:
 *   emit(DataEvents.PRODUCTION_CHANGED);
 *
 *   // Subscribe in a component:
 *   useEffect(() => on(DataEvents.PRODUCTION_CHANGED, () => refresh()), []);
 */

const listeners = new Map();

export const DataEvents = {
  PRODUCTION_CHANGED:  'production:changed',
  EMPLOYEES_CHANGED:   'employees:changed',
  ROLES_CHANGED:       'roles:changed',
  PROMOTIONS_CHANGED:  'promotions:changed',
  DEPARTMENTS_CHANGED: 'departments:changed',
  ANY:                 '*',
};

/**
 * Subscribe to an event. Returns an unsubscribe function.
 * @param {string} event
 * @param {Function} handler
 * @returns {Function} unsubscribe
 */
export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => listeners.get(event)?.delete(handler);
}

/**
 * Emit an event, calling all registered handlers.
 * Also notifies wildcard '*' subscribers.
 */
export function emit(event, data) {
  listeners.get(event)?.forEach(h => { try { h(data); } catch {} });
  if (event !== '*') {
    listeners.get('*')?.forEach(h => { try { h({ event, data }); } catch {} });
  }
}
