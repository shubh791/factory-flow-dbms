'use client';
/**
 * useFactoryData — universal data-fetching hook with module-level caching
 * and real-time event-bus integration.
 *
 * Features:
 *  • Module-level Map cache survives page navigation (no re-fetch on back/forward)
 *  • In-flight deduplication — concurrent calls share the same promise
 *  • TTL-based invalidation (5 min default)
 *  • prefetch() utility for eager loading
 *  • listenTo: [] — auto-refresh when named DataEvents fire
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import API from '@/lib/api';
import { on } from '@/lib/events';

/* ── Module-level cache ────────────────────────────────────────────────── */
const CACHE = new Map(); // cacheKey → { data, ts, inflight: Promise|null }
const DEFAULT_TTL = 5 * 60_000; // 5 minutes

function isFresh(entry, ttl = DEFAULT_TTL) {
  return entry && entry.data != null && Date.now() - entry.ts < ttl;
}

/* ── Prefetch (fire-and-forget) ─────────────────────────────────────────── */
export function prefetch(endpoints = []) {
  endpoints.forEach((ep) => {
    if (isFresh(CACHE.get(ep))) return;
    if (CACHE.get(ep)?.inflight)  return;
    const p = API.get(ep)
      .then((r) => { CACHE.set(ep, { data: r.data, ts: Date.now(), inflight: null }); })
      .catch(() => { const c = CACHE.get(ep); if (c) CACHE.set(ep, { ...c, inflight: null }); });
    CACHE.set(ep, { data: null, ts: 0, inflight: p });
  });
}

/* ── Invalidate specific or all cached entries ──────────────────────────── */
export function invalidateCache(endpoints) {
  if (!endpoints) { CACHE.clear(); return; }
  [].concat(endpoints).forEach((ep) => CACHE.delete(ep));
}

/* ── Main hook ──────────────────────────────────────────────────────────── */
export function useFactoryData(endpoint, {
  autoFetch = true,
  ttl       = DEFAULT_TTL,
  params    = null,
  listenTo  = [],   // DataEvents to auto-refresh on
} = {}) {
  const cacheKey = params ? `${endpoint}?${JSON.stringify(params)}` : endpoint;

  const [data,    setData]    = useState(() => {
    const c = CACHE.get(cacheKey);
    return isFresh(c, ttl) ? c.data : null;
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const doFetch = useCallback(async (force = false) => {
    const cached = CACHE.get(cacheKey);

    if (!force && isFresh(cached, ttl)) {
      setData(cached.data);
      return cached.data;
    }

    // Reuse in-flight promise
    if (cached?.inflight) {
      setLoading(true);
      try {
        await cached.inflight;
        const updated = CACHE.get(cacheKey);
        if (mounted.current && updated?.data != null) { setData(updated.data); setError(null); }
      } catch {} finally {
        if (mounted.current) setLoading(false);
      }
      return CACHE.get(cacheKey)?.data ?? null;
    }

    if (mounted.current) { setLoading(true); setError(null); }

    const p = API.get(endpoint, params ? { params } : undefined).then((r) => r.data);
    CACHE.set(cacheKey, { data: cached?.data ?? null, ts: cached?.ts ?? 0, inflight: p });

    try {
      const result = await p;
      CACHE.set(cacheKey, { data: result, ts: Date.now(), inflight: null });
      if (mounted.current) { setData(result); setError(null); }
      return result;
    } catch (err) {
      const c = CACHE.get(cacheKey);
      if (c) CACHE.set(cacheKey, { ...c, inflight: null });
      const msg = err?.response?.data?.error ?? err?.message ?? 'Request failed';
      if (mounted.current) setError(msg);
      throw new Error(msg);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [cacheKey, endpoint, ttl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fetch on mount / endpoint change
  useEffect(() => {
    if (autoFetch) doFetch().catch(() => {});
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to DataEvents for real-time refresh
  useEffect(() => {
    if (!listenTo.length) return;
    const unsubs = listenTo.map((event) =>
      on(event, () => {
        invalidateCache([cacheKey]);
        doFetch(true).catch(() => {});
      })
    );
    return () => unsubs.forEach((fn) => fn());
  }, [cacheKey, listenTo.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh   = useCallback(() => { invalidateCache([cacheKey]); return doFetch(true); }, [cacheKey, doFetch]);
  const invalidate = useCallback(() => { CACHE.delete(cacheKey); setData(null); setError(null); }, [cacheKey]);

  return {
    data,
    loading,
    error,
    fetch:     doFetch,
    refresh,
    invalidate,
    isCached:  isFresh(CACHE.get(cacheKey), ttl),
  };
}
