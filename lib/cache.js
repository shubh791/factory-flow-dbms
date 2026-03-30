/**
 * Module-level client-side TTL cache with tag invalidation + subscriber pattern.
 * Persists across renders in the same browser session.
 * All hooks share this single cache, enabling cross-component instant sync.
 */

const store   = new Map(); // key → { data, exp, tags }
const subs    = new Map(); // key → Set of callbacks
let   fetching = new Map(); // key → Promise (dedup in-flight requests)

/* ── Read ──────────────────────────────────────────────────────────── */
export function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) { store.delete(key); return null; }
  return entry.data;
}

/* ── Write ─────────────────────────────────────────────────────────── */
export function set(key, data, ttl = 30_000, tags = []) {
  store.set(key, { data, exp: Date.now() + ttl, tags: tags ?? [] });
}

/* ── Invalidate specific keys ──────────────────────────────────────── */
export function invalidate(...keys) {
  keys.forEach((k) => {
    store.delete(k);
    fetching.delete(k);
    notify(k);
  });
}

/* ── Invalidate all keys that have a matching tag ──────────────────── */
export function invalidateTag(tag) {
  for (const [key, entry] of store) {
    if (entry.tags?.includes(tag)) {
      store.delete(key);
      fetching.delete(key);
      notify(key);
    }
  }
}

/* ── Subscribe to changes on a key ────────────────────────────────── */
export function subscribe(key, fn) {
  if (!subs.has(key)) subs.set(key, new Set());
  subs.get(key).add(fn);
  return () => subs.get(key)?.delete(fn); // unsubscribe
}

/* ── Deduplicated fetch (only one in-flight request per key) ───────── */
export async function dedup(key, fetchFn) {
  if (fetching.has(key)) return fetching.get(key);
  const promise = fetchFn().finally(() => fetching.delete(key));
  fetching.set(key, promise);
  return promise;
}

/* ── Notify all subscribers for a key ─────────────────────────────── */
function notify(key) {
  subs.get(key)?.forEach((fn) => {
    try { fn(); } catch { /* swallow subscriber errors */ }
  });
}
