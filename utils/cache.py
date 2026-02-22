# utils/cache.py
# Placeholder for future caching (e.g., surah-level caching)
# Not used yet, but here for Option B structure completeness.

_cache_store = {}


def cache_set(key, value):
    _cache_store[key] = value


def cache_get(key, default=None):
    return _cache_store.get(key, default)