import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import { fallbackPortfolioProjects } from "@/data/portfolioFallback";
import { normalizeMediaUrl } from "@/lib/media";
import { AwardsImagesList, GalleryMediaCard, ImageLoopCard } from "@/components/portfolio/PortfolioImageFrames";

const getImageUrl = (image) => normalizeMediaUrl(typeof image === "string" ? image : image?.image_url);
const categoryKey = (value = "") => String(value || "uncategorized").trim().toLowerCase();
const categoryLabel = (value = "") =>
  String(value || "Uncategorized")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeProject = (project, index, source) => {
  const fallback = fallbackPortfolioProjects[index % fallbackPortfolioProjects.length];
  const cover_image = normalizeMediaUrl(project.cover_image || project.image || project.featured_image || fallback.cover_image);
  const gallerySource = Array.isArray(project.gallery_images) && project.gallery_images.length > 0
    ? project.gallery_images
    : (Array.isArray(project.images) ? project.images : []);

  const moreImages = gallerySource
    .map((image, imageIndex) => {
      const image_url = getImageUrl(image);
      if (!image_url || image_url === cover_image) return null;
      return {
        id: image?.id || `${project.id || project.slug || fallback.id}-${imageIndex}`,
        image_url,
        caption: typeof image === "object" ? image.caption || image.alt_text || "" : "",
        sort_order: Number(image?.sort_order ?? image?.display_order ?? imageIndex + 1),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sort_order - b.sort_order);

  const gallery_images = [
    {
      id: `${project.id || fallback.id}-cover`,
      image_url: cover_image,
      caption: "Cover image",
      sort_order: 0,
    },
    ...moreImages,
  ].filter((image) => image.image_url);

  return {
    id: String(project.id || project.slug || fallback.id || index),
    order: Number(project.order || project.order_number || index + 1),
    title: project.title || fallback.title,
    slug: project.slug || fallback.id,
    category: project.category || fallback.category,
    description: project.description || project.desc || fallback.description,
    cover_image,
    gallery_images,
    image_urls: gallery_images.map((image) => image.image_url).filter(Boolean),
    sourceIndex: source.findIndex((item) => String(item.id || item.slug) === String(project.id || project.slug)),
  };
};

export default function PortfolioCategoryGallery({
  projects = [],
  eyebrow = "Selected Work",
  title = "Portfolio",
  intro = "Browse the main portfolio categories. Open a category to view the full image story.",
  maxProjects = 12,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredProjectIndex, setHoveredProjectIndex] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const display = useMemo(() => {
    const source = projects.length > 0 ? projects : fallbackPortfolioProjects;
    return source
      .map((project, index) => normalizeProject(project, index, source))
      .filter((project) => project.cover_image)
      .sort((a, b) => a.order - b.order)
      .slice(0, maxProjects);
  }, [projects, maxProjects]);

  const categories = useMemo(() => {
    const grouped = display.reduce((acc, project) => {
      const key = categoryKey(project.category);
      if (!acc.has(key)) {
        acc.set(key, { key, label: categoryLabel(project.category), count: 0, images: [] });
      }

      const entry = acc.get(key);
      entry.count += 1;
      entry.images.push(...project.image_urls.slice(0, 2));
      return acc;
    }, new Map());

    return [
      {
        key: "all",
        label: "All Work",
        count: display.length,
        images: display.flatMap((project) => project.image_urls),
      },
      ...Array.from(grouped.values()).sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [display]);
  const visibleProjects = useMemo(() => {
    if (selectedCategory === "all") return display;
    return display.filter((project) => categoryKey(project.category) === selectedCategory);
  }, [display, selectedCategory]);
  const selectedProject = selectedIndex === null ? null : visibleProjects[selectedIndex];
  const activeImage = selectedProject && activeImageIndex !== null
    ? selectedProject.gallery_images[activeImageIndex]
    : null;
  const hoveredProject =
    hoveredProjectIndex === null ? null : visibleProjects[hoveredProjectIndex];

  const closeGallery = () => {
    setActiveImageIndex(null);
    setSelectedIndex(null);
  };

  const moveProject = (direction) => {
    setActiveImageIndex(null);
    setSelectedIndex((current) => {
      if (current === null || visibleProjects.length === 0) return current;
      return (current + direction + visibleProjects.length) % visibleProjects.length;
    });
  };

  const moveImage = (direction) => {
    if (!selectedProject?.gallery_images?.length) return;
    setActiveImageIndex((current) => {
      const index = current === null ? 0 : current;
      return (index + direction + selectedProject.gallery_images.length) % selectedProject.gallery_images.length;
    });
  };

  useEffect(() => {
    if (!selectedProject) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (activeImageIndex !== null) {
          setActiveImageIndex(null);
        } else {
          closeGallery();
        }
      }

      if (activeImageIndex !== null && event.key === "ArrowLeft") {
        moveImage(-1);
      }

      if (activeImageIndex !== null && event.key === "ArrowRight") {
        moveImage(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, selectedProject]);

  useEffect(() => {
    setSelectedIndex(null);
    setActiveImageIndex(null);
    setHoveredProjectIndex(null);
  }, [selectedCategory]);

  if (display.length === 0) return null;

  return (
    <main className="portfolio-category-page">
      <section className="portfolio-category-hero">
        <div>
          <p className="ashley-kicker">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <div>
          <p>{intro}</p>
          <div className="portfolio-browser-stats" aria-label="Portfolio summary">
            <span>{display.length} projects</span>
            <span>{categories.length - 1} categories</span>
            <span>{display.reduce((total, project) => total + project.gallery_images.length, 0)} images</span>
          </div>
          <div className="portfolio-hero-preview" aria-hidden="true">
            {display.slice(0, 3).map((project, index) => (
              <span
                key={project.id}
                style={{ backgroundImage: `url(${project.cover_image})` }}
                className={`is-frame-${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-category-filter" aria-label="Filter portfolio by category">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            className={selectedCategory === category.key ? "is-active" : ""}
            onClick={() => setSelectedCategory(category.key)}
          >
            <span>{category.label}</span>
            <em>{String(category.count).padStart(2, "0")}</em>
          </button>
        ))}
      </section>

      <section
        className="portfolio-project-rail"
        aria-label="Quick project browser"
        onMouseMove={(event) => {
          setCursorPosition({ x: event.clientX, y: event.clientY });
        }}
      >
        {visibleProjects.map((project, index) => {
          return (
            <button
              key={project.id}
              type="button"
              onMouseEnter={() => setHoveredProjectIndex(index)}
              onMouseLeave={() => setHoveredProjectIndex(null)}
              onFocus={() => setHoveredProjectIndex(index)}
              onBlur={() => setHoveredProjectIndex(null)}
              onClick={() => setSelectedIndex(index)}
            >
              <span>{String(project.order || index + 1).padStart(2, "0")}</span>
              <strong>{project.title}</strong>
              <em>{categoryLabel(project.category)}</em>
              <AwardsImagesList images={project.image_urls} />
            </button>
          );
        })}

        <AnimatePresence>
          {hoveredProject && (
            <motion.div
              className="portfolio-image-cursor"
              key={hoveredProject.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: cursorPosition.x + 24,
                y: cursorPosition.y - 115,
              }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            >
              <img src={hoveredProject.cover_image} alt="" />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="portfolio-category-grid" aria-label="Portfolio categories">
        {visibleProjects.map((project, index) => (
          <motion.article
            key={project.id}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.24 }}
            transition={{ delay: index * 0.05 }}
          >
            <button
              type="button"
              className="portfolio-category-card"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Open gallery for ${project.title}`}
            >
              <span className="portfolio-category-number">{String(project.order || index + 1).padStart(2, "0")}</span>
              <ImageLoopCard
                images={project.image_urls}
                alt={project.title}
                interval={1200 + (index % 4) * 240}
              />
              <span className="portfolio-category-card-title">
                <em>{categoryLabel(project.category)}</em>
                <strong>{project.title}</strong>
              </span>
              <span className="portfolio-category-open">
                View Pictures
                <ArrowUpRight />
              </span>
            </button>
            <div className="portfolio-category-copy">
              <p>Category: {categoryLabel(project.category)}</p>
              <h2>{project.title}</h2>
              <span>{project.description}</span>
              <em>{project.gallery_images.length} images</em>
            </div>
          </motion.article>
        ))}
      </section>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            className="portfolio-gallery-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedProject.title} gallery`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="portfolio-gallery-close" onClick={closeGallery} aria-label="Close gallery">
              <X />
            </button>

            <div className="portfolio-gallery-panel">
              <div className="portfolio-gallery-head">
                <div>
                  <p>{String(selectedProject.order).padStart(2, "0")} / {categoryLabel(selectedProject.category)}</p>
                  <h2>{selectedProject.title}</h2>
                  <span>{selectedProject.description}</span>
                </div>
                <div className="portfolio-gallery-nav">
                  <button type="button" onClick={() => moveProject(-1)} aria-label="Previous project">
                    <ArrowLeft />
                    Previous
                  </button>
                  <button type="button" onClick={() => moveProject(1)} aria-label="Next project">
                    Next
                    <ArrowRight />
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="portfolio-gallery-main"
                onClick={() => setActiveImageIndex(0)}
                aria-label={`View ${selectedProject.title} cover image fullscreen`}
              >
                <img src={selectedProject.cover_image} alt={selectedProject.title} />
                <span>View Fullscreen</span>
              </button>

              <div className="portfolio-gallery-section-title">
                <p>Gallery View</p>
                <span>Scroll through all images</span>
              </div>

              <div className="portfolio-gallery-strip">
                {selectedProject.gallery_images.map((image, imageIndex) => (
                  <figure key={image.id || image.image_url}>
                    <GalleryMediaCard
                      image={image}
                      index={imageIndex}
                      projectTitle={selectedProject.title}
                      onClick={() => setActiveImageIndex(imageIndex)}
                    />
                    {image.caption && image.caption !== "Cover image" && <figcaption>{image.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {activeImage && (
                <motion.div
                  className="portfolio-image-lightbox"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Fullscreen portfolio image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    type="button"
                    className="portfolio-image-lightbox-close"
                    onClick={() => setActiveImageIndex(null)}
                    aria-label="Close fullscreen image"
                  >
                    <X />
                  </button>

                  <button
                    type="button"
                    className="portfolio-image-lightbox-nav is-prev"
                    onClick={() => moveImage(-1)}
                    aria-label="Previous image"
                  >
                    <ArrowLeft />
                  </button>

                  <img src={activeImage.image_url} alt={activeImage.caption || selectedProject.title} />

                  <button
                    type="button"
                    className="portfolio-image-lightbox-nav is-next"
                    onClick={() => moveImage(1)}
                    aria-label="Next image"
                  >
                    <ArrowRight />
                  </button>

                  <div className="portfolio-image-lightbox-caption">
                    <p>{String(activeImageIndex + 1).padStart(2, "0")} / {String(selectedProject.gallery_images.length).padStart(2, "0")}</p>
                    <span>{activeImage.caption && activeImage.caption !== "Cover image" ? activeImage.caption : selectedProject.title}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
