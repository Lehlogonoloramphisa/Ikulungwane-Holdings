import { useEffect, useMemo, useSyncExternalStore } from "react";
import { cmsDefaults } from "@/data/cmsDefaults";

const CMS_KEY = "ikulungwane_cms_content";
const CONTENT_ENDPOINT = "/api/content.php";
const LEGACY_DEFAULT_ACCENT = "#ff9800";
const DEFAULT_ACCENT = "#e11d2e";
const TYPOGRAPHY_LIMITS = {
  logo: [18, 24],
  footerLogo: [22, 30],
  navigation: [10, 12],
  heroHeading: [46, 76],
  sectionHeading: [30, 46],
  body: [14, 16],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

let backendOverride = {};
let backendLoaded = false;
let backendLoading = null;

const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

export const deepMerge = (base, override) => {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? clone(override) : clone(base);
  }

  if (!isPlainObject(base)) {
    return override === undefined ? base : override;
  }

  const output = { ...base };
  if (!isPlainObject(override)) {
    return clone(output);
  }

  Object.entries(override).forEach(([key, value]) => {
    output[key] = key in base ? deepMerge(base[key], value) : clone(value);
  });

  return output;
};

const getStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const clampStoredNumber = (value, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return Math.min(max, Math.max(min, number));
};

const normalizeOverride = (override) => {
  try {
    const output = isPlainObject(override) ? clone(override) : {};
    const branding = output?.global?.branding;

    if (branding) {
      if (branding.primaryColor === LEGACY_DEFAULT_ACCENT) {
        branding.primaryColor = DEFAULT_ACCENT;
      }
      if (branding.accentColor === LEGACY_DEFAULT_ACCENT) {
        branding.accentColor = DEFAULT_ACCENT;
      }
      if (isPlainObject(branding.textSizes)) {
        Object.entries(TYPOGRAPHY_LIMITS).forEach(([key, [min, max]]) => {
          if (branding.textSizes[key] !== undefined) {
            branding.textSizes[key] = clampStoredNumber(branding.textSizes[key], min, max);
          }
        });
      }
    }

    return output;
  } catch {
    return {};
  }
};

const readLocalCmsOverride = () => {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const raw = storage.getItem(CMS_KEY);
    return normalizeOverride(raw ? JSON.parse(raw) : {});
  } catch {
    return {};
  }
};

const dispatchCmsUpdate = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ikulungwane:cms-updated"));
  }
};

const saveCmsContentToBackend = async (content) => {
  const response = await fetch(`${CONTENT_ENDPOINT}?action=saveSettings`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error("Could not save settings to the backend.");
  }

  backendOverride = normalizeOverride(content);
  backendLoaded = true;
  dispatchCmsUpdate();
};

export const refreshCmsContent = async ({ force = false } = {}) => {
  if (backendLoaded && !force) return backendOverride;
  if (backendLoading) return backendLoading;

  backendLoading = fetch(`${CONTENT_ENDPOINT}?action=getSettings`, {
    credentials: "include",
  })
    .then(async (response) => {
      const text = await response.text();
      if (!response.ok || !text) return {};

      const data = JSON.parse(text);
      backendOverride = normalizeOverride(data.content || {});
      backendLoaded = true;
      dispatchCmsUpdate();
      return backendOverride;
    })
    .catch(() => ({}))
    .finally(() => {
      backendLoading = null;
    });

  return backendLoading;
};

export const readCmsOverride = () => deepMerge(backendOverride, readLocalCmsOverride());

export const getCmsContent = () => deepMerge(cmsDefaults, readCmsOverride());

export const saveCmsContent = (content) => {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(CMS_KEY, JSON.stringify(content));
    } catch {
      // Backend persistence still runs below. This can happen if local uploads
      // create very large data URLs during local development.
    }
  }
  dispatchCmsUpdate();
  saveCmsContentToBackend(content).catch(() => {});
};

export const resetCmsContent = () => {
  const storage = getStorage();
  storage?.removeItem(CMS_KEY);
  backendOverride = {};
  backendLoaded = false;
  dispatchCmsUpdate();
  saveCmsContentToBackend(cmsDefaults).catch(() => {});
};

const subscribe = (callback) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("ikulungwane:cms-updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("ikulungwane:cms-updated", callback);
    window.removeEventListener("storage", callback);
  };
};

const getSnapshot = () => JSON.stringify({
  backend: backendOverride,
  local: readLocalCmsOverride(),
});
const getServerSnapshot = () => "{}";

export const useCms = () => {
  useEffect(() => {
    refreshCmsContent();
  }, []);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => deepMerge(cmsDefaults, readCmsOverride()), [snapshot]);
};

export const useCmsOverride = () => {
  useEffect(() => {
    refreshCmsContent();
  }, []);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => readCmsOverride(), [snapshot]);
};

export const orderedEnabled = (items = []) =>
  [...items]
    .filter((item) => item?.enabled !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

export const getValueByPath = (object, path) =>
  path.split(".").reduce((value, key) => (value == null ? value : value[key]), object);

export const setValueByPath = (object, path, value) => {
  const keys = path.split(".");
  const copy = clone(object);
  let cursor = copy;
  keys.slice(0, -1).forEach((key) => {
    if (!isPlainObject(cursor[key]) && !Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  });
  cursor[keys[keys.length - 1]] = value;
  return copy;
};
