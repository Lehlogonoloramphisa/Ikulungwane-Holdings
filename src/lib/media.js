const DRIVE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([^/]+)/i,
  /drive\.google\.com\/open\?id=([^&]+)/i,
  /drive\.google\.com\/uc\?[^#]*id=([^&]+)/i,
  /drive\.google\.com\/thumbnail\?[^#]*id=([^&]+)/i,
  /[?&]id=([^&]+)/i,
];

export const googleDriveFileId = (value) => {
  const url = String(value || "").trim();
  if (!url || !/drive\.google\.com/i.test(url)) return "";

  const match = DRIVE_ID_PATTERNS.map((pattern) => url.match(pattern)).find(Boolean);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
};

export const googleDriveImageUrl = (value) => {
  const url = String(value || "").trim();
  const id = googleDriveFileId(url);
  return id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w2400` : url;
};

export const googleDriveDocumentPreviewUrl = (value) => {
  const url = String(value || "").trim();
  const id = googleDriveFileId(url);
  return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` : url;
};

export const googleDriveDocumentDownloadUrl = (value) => {
  const url = String(value || "").trim();
  const id = googleDriveFileId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}` : url;
};

export const normalizeMediaUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  return /drive\.google\.com/i.test(url) ? googleDriveImageUrl(url) : url;
};

export const normalizeDocumentUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  return /drive\.google\.com/i.test(url) ? googleDriveDocumentPreviewUrl(url) : url;
};

export const documentDownloadUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  return /drive\.google\.com/i.test(url) ? googleDriveDocumentDownloadUrl(url) : url;
};

export const isPdfDocumentUrl = (value) => /\.pdf(?:[?#].*)?$/i.test(String(value || "").trim());

export const isUploadedMediaUrl = (value) => {
  const url = String(value || "");
  return (
    url.startsWith("data:image/") ||
    url.includes("/api/uploads/") ||
    url.includes("/uploads/") ||
    url.includes("drive.google.com/thumbnail")
  );
};
