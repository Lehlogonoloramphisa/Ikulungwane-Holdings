import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import { fallbackPortfolioProjects } from "@/data/portfolioFallback";
import { normalizeMediaUrl } from "@/lib/media";

const getImageUrl = (image) => normalizeMediaUrl(typeof image === "string" ? image : image?.image_url);

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

  return {
    id: String(project.id || project.slug || fallback.id || index),
    order: Number(project.order || project.order_number || index + 1),
    title: project.title || fallback.title,
    slug: project.slug || fallback.id,
    category: project.category || fallback.category,
    description: project.description || project.desc || fallback.description,
    cover_image,
    gallery_images: [
      {
        id: `${project.id || fallback.id}-cover`,
        image_url: cover_image,
        caption: "Cover image",
        sort_order: 0,
      },
      ...moreImages,
    ].filter((image) => image.image_url),
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

  const display = useMemo(() => {
    const source = projects.length > 0 ? projects : fallbackPortfolioProjects;
    return source
      .map((project, index) => normalizeProject(project, index, source))
      .filter((project) => project.cover_image)
      .sort((a, b) => a.order - b.order)
      .slice(0, maxProjects);
  }, [projects, maxProjects]);

  const selectedProject = selectedIndex === null ? null : display[selectedIndex];
  const activeImage = selectedProject && activeImageIndex !== null
    ? selectedProject.gallery_images[activeImageIndex]
    : null;

  const closeGallery = () => {
    setActiveImageIndex(null);
    setSelectedIndex(null);
  };

  const moveProject = (direction) => {
    setActiveImageIndex(null);
    setSelectedIndex((current) => {
      if (current === null || display.length === 0) return current;
      return (current + direction + display.length) % display.length;
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

  if (display.length === 0) return null;

  return (
    <main className="portfolio-category-page">
      <section className="portfolio-category-hero">
        <div>
          <p className="ashley-kicker">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <p>{intro}</p>
      </section>

      <section className="portfolio-category-grid" aria-label="Portfolio categories">
        {display.map((project, index) => (
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
              <img src={project.cover_image} alt={project.title} />
              <span className="portfolio-category-open">
                Open Gallery
                <ArrowUpRight />
              </span>
            </button>
            <div className="portfolio-category-copy">
              <p>Category: {project.category}</p>
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
                  <p>{String(selectedProject.order).padStart(2, "0")} / {selectedProject.category}</p>
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
                    <button
                      type="button"
                      className="portfolio-gallery-image-button"
                      onClick={() => setActiveImageIndex(imageIndex)}
                      aria-label={`View ${selectedProject.title} image ${imageIndex + 1} fullscreen`}
                    >
                      <img src={image.image_url} alt={image.caption || `${selectedProject.title} image ${imageIndex + 1}`} />
                    </button>
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
