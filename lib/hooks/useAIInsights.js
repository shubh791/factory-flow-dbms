'use client';
/**
 * useAIInsights — generic hook for AI endpoint calls with 5-min caching.
 *
 * Prevents re-calling the AI on every mount/refresh.
 * Cache is module-level (survives across navigation).
 */
import { useCallback, useState } from 'react';
import API from '@/lib/api';

const aiCache = new Map(); // key → { data, ts }
const AI_TTL  = 5 * 60_000; // 5 minutes

export function useAIInsights(cacheKey) {
  const [data,    setData]    = useState(() => {
    const c = aiCache.get(cacheKey);
    return c && Date.now() - c.ts < AI_TTL ? c.data : null;
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const fetch = useCallback(async (endpoint, params = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(endpoint, { params });
      aiCache.set(cacheKey, { data: res.data, ts: Date.now() });
      setData(res.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'AI analysis failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  const invalidate = useCallback(() => {
    aiCache.delete(cacheKey);
    setData(null);
    setError('');
  }, [cacheKey]);

  const isCached = !!aiCache.get(cacheKey) && Date.now() - (aiCache.get(cacheKey)?.ts ?? 0) < AI_TTL;

  return { data, loading, error, fetch, invalidate, isCached };
}
