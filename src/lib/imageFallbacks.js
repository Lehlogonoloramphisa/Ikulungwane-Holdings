const FALLBACK_IMAGES = [
  "/assets/fallbacks/portfolio-01.svg",
  "/assets/fallbacks/portfolio-02.svg",
  "/assets/fallbacks/portfolio-03.svg",
  "/assets/fallbacks/portfolio-04.svg",
  "/assets/fallbacks/portfolio-05.svg",
  "/assets/fallbacks/portfolio-06.svg",
  "/assets/fallbacks/portfolio-07.svg",
];

const hashValue = (value = "") => {
  const text = String(value || "ikulungwane");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export const fallbackImageFor = (seed = "") =>
  FALLBACK_IMAGES[hashValue(seed) % FALLBACK_IMAGES.length];

export const applyImageFallback = (image, seed = "") => {
  if (!image || image.dataset.imageFallbackApplied === "true") return;

  image.dataset.imageFallbackApplied = "true";
  image.classList.add("image-fallback-applied");
  image.src = fallbackImageFor(seed || image.alt || image.currentSrc || image.src);
};

export const installImageFallbacks = (root = document) => {
  const onError = (event) => {
    if (event.target instanceof HTMLImageElement) {
      applyImageFallback(event.target);
    }
  };

  const scanBrokenImages = () => {
    root.querySelectorAll("img").forEach((image) => {
      if (image.complete && image.naturalWidth === 0) {
        applyImageFallback(image);
      }
    });
  };

  root.addEventListener("error", onError, true);
  window.addEventListener("load", scanBrokenImages);
  const scanTimers = [
    window.setTimeout(scanBrokenImages, 600),
    window.setTimeout(scanBrokenImages, 2200),
  ];

  return () => {
    root.removeEventListener("error", onError, true);
    window.removeEventListener("load", scanBrokenImages);
    scanTimers.forEach((timerId) => window.clearTimeout(timerId));
  };
};
