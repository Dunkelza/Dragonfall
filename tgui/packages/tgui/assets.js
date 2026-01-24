/**
 * @file
 * @copyright 2020 Aleksej Komarov
 * @license MIT
 */

const EXCLUDED_PATTERNS = [/v4shim/i];
const loadedMappings = {};

// Cache busting for BYOND's embedded browser.
// The embedded browser can aggressively cache resources between reconnects,
// which makes it easy to end up running a stale tgui bundle after rebuilds.
// We apply a per-session cache-buster to JS/CSS/JSON assets.
const CACHE_BUST = Date.now().toString(36);

const appendCacheBust = (url) => {
  if (!url || typeof url !== 'string') {
    return url;
  }
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  // Avoid double-appending if upstream already included a cache-buster.
  if (url.includes('v=')) {
    return url;
  }
  const joiner = url.includes('?') ? '&' : '?';
  return `${url}${joiner}v=${CACHE_BUST}`;
};

export const resolveAsset = (name) => {
  const url = loadedMappings[name] || name;
  const lowerName = String(name || '').toLowerCase();
  if (
    lowerName.endsWith('.js') ||
    lowerName.endsWith('.css') ||
    lowerName.endsWith('.json')
  ) {
    return appendCacheBust(url);
  }
  return url;
};

export const assetMiddleware = (store) => (next) => (action) => {
  const { type, payload } = action;
  if (type === 'asset/stylesheet') {
    Byond.loadCss(payload);
    return;
  }
  if (type === 'asset/mappings') {
    for (let name of Object.keys(payload)) {
      // Skip anything that matches excluded patterns
      if (EXCLUDED_PATTERNS.some((regex) => regex.test(name))) {
        continue;
      }
      const url = payload[name];
      const ext = name.split('.').pop();
      loadedMappings[name] = url;
      if (ext === 'css') {
        Byond.loadCss(resolveAsset(name));
      }
      if (ext === 'js') {
        Byond.loadJs(resolveAsset(name));
      }
    }
    return;
  }
  next(action);
};
