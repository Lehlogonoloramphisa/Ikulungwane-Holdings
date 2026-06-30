const fallbackImages = [
  "/assets/fallbacks/portfolio-01.svg",
  "/assets/fallbacks/portfolio-02.svg",
  "/assets/fallbacks/portfolio-03.svg",
  "/assets/fallbacks/portfolio-04.svg",
  "/assets/fallbacks/portfolio-05.svg",
  "/assets/fallbacks/portfolio-06.svg",
  "/assets/fallbacks/portfolio-07.svg",
];

const fallbackImage = (index) => fallbackImages[index % fallbackImages.length];

const gallerySet = (startIndex, captions) =>
  captions.map((caption, index) => ({
    image_url: fallbackImage(startIndex + index),
    caption,
    sort_order: index + 1,
  }));

export const fallbackPortfolioProjects = [
  {
    id: "studio-portrait-series",
    title: "Studio Portrait Series",
    category: "lifestyle",
    description: "A controlled portrait study built around clean light, confident direction, and refined personal presence.",
    cover_image: fallbackImage(0),
    gallery_images: gallerySet(0, [
      "Main portrait direction",
      "Soft studio expression",
      "Editorial profile study",
      "Natural portrait detail",
    ]),
  },
  {
    id: "qmane",
    title: "Qmane",
    category: "weddings",
    description: "A romantic wedding gallery shaped around ceremony detail, family emotion, portraits, and reception atmosphere.",
    cover_image: fallbackImage(1),
    gallery_images: gallerySet(1, [
      "Wedding cover moment",
      "Ceremony detail",
      "Reception atmosphere",
      "Portrait session",
    ]),
  },
  {
    id: "corporate-excellence-gala",
    title: "Corporate Excellence Gala",
    category: "corporate",
    description: "A polished evening showcase with dramatic light, guest portraits, stage moments, and premium event coverage.",
    cover_image: fallbackImage(2),
    gallery_images: gallerySet(2, [
      "Main gala atmosphere",
      "Audience and stage",
      "Event energy",
      "Speaker moment",
    ]),
  },
  {
    id: "class-of-2024-graduation",
    title: "Class of 2024 Graduation",
    category: "graduations",
    description: "A celebratory academic archive focused on family emotion, formal portraits, and candid ceremony details.",
    cover_image: fallbackImage(3),
    gallery_images: gallerySet(3, [
      "Graduation cover image",
      "Campus celebration",
      "Class group moment",
      "Academic portrait",
    ]),
  },
  {
    id: "urban-lifestyle-collection",
    title: "Urban Lifestyle Collection",
    category: "lifestyle",
    description: "Street-level portraiture with movement, texture, architecture, and editorial styling.",
    cover_image: fallbackImage(4),
    gallery_images: gallerySet(4, [
      "Urban cover frame",
      "Styled city portrait",
      "Fashion movement",
      "Editorial street texture",
    ]),
  },
  {
    id: "brand-story-campaign",
    title: "Brand Story Campaign",
    category: "corporate",
    description: "A visual brand system translated into product imagery, founder portraits, social content, and web-ready assets.",
    cover_image: fallbackImage(5),
    gallery_images: gallerySet(5, [
      "Brand planning session",
      "Campaign direction",
      "Creative workshop",
      "Digital rollout",
    ]),
  },
  {
    id: "product-light-study",
    title: "Product Light Study",
    category: "product",
    description: "Minimal product photography shaped with reflective surfaces, controlled shadows, and clean commercial framing.",
    cover_image: fallbackImage(6),
    gallery_images: gallerySet(6, [
      "Product cover frame",
      "Clean product detail",
      "Commercial texture",
      "Light and shadow study",
    ]),
  },
];
