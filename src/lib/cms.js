import { useMemo, useSyncExternalStore } from "react";
import { cmsDefaults } from "@/data/cmsDefaults";

const CMS_KEY = "ikulungwane_cms_content";
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

export const readCmsOverride = () => {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const raw = storage.getItem(CMS_KEY);
    const override = raw ? JSON.parse(raw) : {};
    const branding = override?.global?.branding;

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

    return override;
  } catch {
    return {};
  }
};

export const getCmsContent = () => deepMerge(cmsDefaults, readCmsOverride());

export const saveCmsContent = (content) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(CMS_KEY, JSON.stringify(content));
  window.dispatchEvent(new CustomEvent("ikulungwane:cms-updated"));
};

export const resetCmsContent = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(CMS_KEY);
  window.dispatchEvent(new CustomEvent("ikulungwane:cms-updated"));
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

const getSnapshot = () => JSON.stringify(readCmsOverride());
const getServerSnapshot = () => "{}";

export const useCms = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => deepMerge(cmsDefaults, JSON.parse(snapshot || "{}")), [snapshot]);
};

export const useCmsOverride = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => JSON.parse(snapshot || "{}"), [snapshot]);
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
