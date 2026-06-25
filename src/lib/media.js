const DRIVE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([^/]+)/i,
  /drive\.google\.com\/open\?id=([^&]+)/i,
  /drive\.google\.com\/uc\?[^#]*id=([^&]+)/i,
  /drive\.google\.com\/thumbnail\?[^#]*id=([^&]+)/i,
  /[?&]id=([^&]+)/i,
];

export const googleDriveImageUrl = (value) => {
  const url = String(value || "").trim();
  if (!url || !/drive\.google\.com/i.test(url)) return "";

  const match = DRIVE_ID_PATTERNS.map((pattern) => url.match(pattern)).find(Boolean);
  const id = match?.[1] ? decodeURIComponent(match[1]) : "";
  return id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w2400` : url;
};

export const normalizeMediaUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  return /drive\.google\.com/i.test(url) ? googleDriveImageUrl(url) : url;
};

export const isUploadedMediaUrl = (value) => {
  const url = String(value || "");
  return (
    url.startsWith("data:image/") ||
    url.includes("/api/uploads/") ||
    url.includes("/uploads/") ||
    url.includes("drive.google.com/thumbnail")
  );
};
