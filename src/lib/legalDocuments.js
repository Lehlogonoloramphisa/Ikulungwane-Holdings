import { useEffect, useState } from "react";
import { legalPages } from "@/data/fallbackContent";

const LEGAL_ENDPOINT = "/api/legal-documents.php";
const LEGAL_STORAGE_KEY = "ikulungwane_legal_documents";
const LEGAL_EVENT = "ikulungwane:legal-documents-updated";

const clone = (value) => JSON.parse(JSON.stringify(value));

export const normalizeLegalSlug = (value) => {
  const clean = String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || "privacy";
};

export const legalPath = (slug) => `/${normalizeLegalSlug(slug)}`;

const fallbackContent = (key) => (legalPages[key]?.body || []).join("\n\n");

export const defaultLegalDocuments = [
  {
    id: "local-privacy",
    title: "Privacy Policy",
    slug: "privacy",
    footer_label: "Privacy Policy",
    content: fallbackContent("privacy"),
    pdf_url: "",
    meta_title: "Privacy Policy | Ikulungwane Holdings",
    meta_description: "How Ikulungwane Holdings handles website enquiries, bookings, and personal information.",
    show_in_footer: true,
    sort_order: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "local-terms",
    title: "Terms & Conditions",
    slug: "terms",
    footer_label: "Terms & Conditions",
    content: fallbackContent("terms"),
    pdf_url: "",
    meta_title: "Terms & Conditions | Ikulungwane Holdings",
    meta_description: "Project terms, bookings, deliverables, and service information for Ikulungwane Holdings.",
    show_in_footer: true,
    sort_order: 2,
    created_at: "",
    updated_at: "",
  },
  {
    id: "local-cookies",
    title: "Cookie Policy",
    slug: "cookies",
    footer_label: "Cookie Policy",
    content: fallbackContent("cookies"),
    pdf_url: "",
    meta_title: "Cookie Policy | Ikulungwane Holdings",
    meta_description: "Cookie and browser storage information for the Ikulungwane Holdings website.",
    show_in_footer: true,
    sort_order: 3,
    created_at: "",
    updated_at: "",
  },
];

export const emptyLegalDocument = (sortOrder = 1) => ({
  title: "New Legal Document",
  slug: "new-legal-document",
  footer_label: "New Legal Document",
  content: "",
  pdf_url: "",
  meta_title: "",
  meta_description: "",
  show_in_footer: true,
  sort_order: sortOrder,
});

const booleanValue = (value, fallback = true) => {
  if (value === undefined || value === null) return fallback;
  return value === true || value === 1 || value === "1" || value === "true";
};

const normalizeLegalDocument = (document = {}, index = 0) => {
  const fallback = defaultLegalDocuments[index] || emptyLegalDocument(index + 1);
  const title = document.title || fallback.title;
  const slug = normalizeLegalSlug(document.slug || fallback.slug || title);

  return {
    ...fallback,
    ...document,
    id: document.id,
    title,
    slug,
    footer_label: document.footer_label || document.label || title,
    content: document.content ?? fallback.content ?? "",
    pdf_url: document.pdf_url || document.documentUrl || "",
    meta_title: document.meta_title || "",
    meta_description: document.meta_description || "",
    show_in_footer: document.enabled === false ? false : booleanValue(document.show_in_footer, true),
    sort_order: Number(document.sort_order ?? document.order ?? fallback.sort_order ?? index + 1),
    created_at: document.created_at || document.created_date || "",
    updated_at: document.updated_at || document.updated_date || "",
  };
};

const sortDocuments = (documents) =>
  [...documents].sort((a, b) => {
    const order = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    return order || String(a.title).localeCompare(String(b.title));
  });

const getStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const dispatchLegalUpdate = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LEGAL_EVENT));
  }
};

const readLocalDocuments = () => {
  const storage = getStorage();
  if (!storage) return clone(defaultLegalDocuments);

  try {
    const raw = storage.getItem(LEGAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultLegalDocuments;
    return sortDocuments((Array.isArray(parsed) ? parsed : defaultLegalDocuments).map(normalizeLegalDocument));
  } catch {
    return clone(defaultLegalDocuments);
  }
};

const writeLocalDocuments = (documents) => {
  const storage = getStorage();
  const normalized = sortDocuments(documents.map(normalizeLegalDocument));
  storage?.setItem(LEGAL_STORAGE_KEY, JSON.stringify(normalized));
  dispatchLegalUpdate();
  return normalized;
};

const parseJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("Legal documents API is not available.");
    error.unavailable = true;
    error.status = response.status;
    throw error;
  }
};

const requestLegalApi = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: options.body ? { "Content-Type": "application/json", ...(options.headers || {}) } : options.headers,
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const error = new Error(data.error || "Legal documents request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const shouldUseFallback = (error) =>
  error?.unavailable || error instanceof TypeError || [404, 503].includes(Number(error?.status));

export const listLegalDocuments = async ({ footerOnly = false } = {}) => {
  try {
    const query = footerOnly ? "?footer=1" : "";
    const result = await requestLegalApi(`${LEGAL_ENDPOINT}${query}`);
    if (Array.isArray(result.items)) {
      return sortDocuments(result.items.map(normalizeLegalDocument));
    }
  } catch (error) {
    if (!shouldUseFallback(error)) throw error;
  }

  const documents = readLocalDocuments();
  return footerOnly ? documents.filter((document) => document.show_in_footer) : documents;
};

export const getLegalDocument = async (slug) => {
  const cleanSlug = normalizeLegalSlug(slug);

  try {
    const result = await requestLegalApi(`${LEGAL_ENDPOINT}?slug=${encodeURIComponent(cleanSlug)}`);
    if (result.item) return normalizeLegalDocument(result.item);
  } catch (error) {
    if (!shouldUseFallback(error)) throw error;
  }

  return readLocalDocuments().find((document) => document.slug === cleanSlug) || null;
};

export const saveLegalDocument = async (document) => {
  const payload = normalizeLegalDocument(document);
  const numericId = Number(payload.id);
  const hasBackendId = Number.isFinite(numericId) && numericId > 0;

  try {
    const result = await requestLegalApi(
      hasBackendId ? `${LEGAL_ENDPOINT}?id=${encodeURIComponent(numericId)}` : LEGAL_ENDPOINT,
      {
        method: hasBackendId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }
    );
    if (result.item) {
      dispatchLegalUpdate();
      return normalizeLegalDocument(result.item);
    }
  } catch (error) {
    if (!shouldUseFallback(error)) throw error;
  }

  const documents = readLocalDocuments();
  const id = payload.id || `local-${Date.now().toString(36)}`;
  const nextDocument = {
    ...payload,
    id,
    updated_at: new Date().toISOString(),
  };
  const index = documents.findIndex((item) => item.id === id || item.slug === payload.slug);
  const next = index >= 0
    ? documents.map((item, itemIndex) => (itemIndex === index ? nextDocument : item))
    : [...documents, nextDocument];

  writeLocalDocuments(next);
  return nextDocument;
};

export const deleteLegalDocument = async (document) => {
  const numericId = Number(document?.id);
  const hasBackendId = Number.isFinite(numericId) && numericId > 0;

  try {
    if (hasBackendId) {
      await requestLegalApi(`${LEGAL_ENDPOINT}?id=${encodeURIComponent(numericId)}`, { method: "DELETE" });
      dispatchLegalUpdate();
      return { success: true };
    }
  } catch (error) {
    if (!shouldUseFallback(error)) throw error;
  }

  const slug = normalizeLegalSlug(document?.slug);
  writeLocalDocuments(readLocalDocuments().filter((item) => item.id !== document?.id && item.slug !== slug));
  return { success: true };
};

export const useLegalDocuments = ({ footerOnly = false } = {}) => {
  const [documents, setDocuments] = useState(() => {
    const localDocuments = readLocalDocuments();
    return footerOnly ? localDocuments.filter((document) => document.show_in_footer) : localDocuments;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = () => {
      setLoading(true);
      listLegalDocuments({ footerOnly })
        .then((items) => {
          if (mounted) setDocuments(items);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    };

    load();
    window.addEventListener(LEGAL_EVENT, load);
    return () => {
      mounted = false;
      window.removeEventListener(LEGAL_EVENT, load);
    };
  }, [footerOnly]);

  return { documents, loading, reload: () => listLegalDocuments({ footerOnly }).then(setDocuments) };
};

export const useLegalDocument = (slug) => {
  const cleanSlug = normalizeLegalSlug(slug);
  const [document, setDocument] = useState(() => readLocalDocuments().find((item) => item.slug === cleanSlug) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = () => {
      setLoading(true);
      getLegalDocument(cleanSlug)
        .then((item) => {
          if (mounted) setDocument(item);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    };

    load();
    window.addEventListener(LEGAL_EVENT, load);
    return () => {
      mounted = false;
      window.removeEventListener(LEGAL_EVENT, load);
    };
  }, [cleanSlug]);

  return { document, loading };
};
