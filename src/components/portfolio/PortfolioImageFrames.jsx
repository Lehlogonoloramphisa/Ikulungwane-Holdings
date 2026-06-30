import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const projectImageTokens = {
  radiusSmall: 5,
  radiusDefault: 10,
  imageLoopCard: {
    width: 136,
    height: 198,
  },
  imageCard: {
    width: 132,
    height: 193,
  },
  galleryCard: {
    width: 171,
    height: 191,
  },
  imageCursor: {
    width: 160,
    height: 230,
    radius: 5,
  },
  awardsList: {
    gap: 10,
    radius: 5,
  },
  springDefault: {
    type: "spring",
    duration: 0.4,
    bounce: 0.2,
  },
  springGallery: {
    type: "spring",
    duration: 0.6,
    bounce: 0,
  },
};

const imageList = (images = []) => images.filter(Boolean);

export function ImageLoopCard({
  images,
  interval = 1400,
  alt = "",
  className = "",
}) {
  const frames = useMemo(() => imageList(images), [images]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [frames.length]);

  useEffect(() => {
    if (frames.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [frames.length, interval]);

  if (frames.length === 0) return null;

  return (
    <div className={`portfolio-loop-card ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <AnimatePresence mode="wait">
        <motion.img
          key={`${frames[index]}-${index}`}
          src={frames[index]}
          alt=""
          initial={{ opacity: 0, scale: 1.045 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.985 }}
          transition={projectImageTokens.springDefault}
          draggable="false"
        />
      </AnimatePresence>
    </div>
  );
}

export function GalleryMediaCard({
  image,
  index,
  projectTitle,
  onClick,
}) {
  const src = typeof image === "string" ? image : image?.image_url;
  const caption = typeof image === "object" ? image.caption || image.alt_text || "" : "";
  const isVideo = /\.(mp4|mov|webm)(?:[?#].*)?$/i.test(src || "");

  if (!src) return null;

  return (
    <motion.button
      type="button"
      className="portfolio-gallery-image-button"
      onClick={onClick}
      aria-label={`View ${projectTitle} image ${index + 1} fullscreen`}
      whileHover={{ scale: 1.018 }}
      whileTap={{ scale: 0.985 }}
      transition={projectImageTokens.springGallery}
    >
      {isVideo ? (
        <video src={src} autoPlay muted loop playsInline controls={false} />
      ) : (
        <img src={src} alt={caption || `${projectTitle} image ${index + 1}`} />
      )}
    </motion.button>
  );
}

export function AwardsImagesList({ images = [] }) {
  const frames = imageList(images).slice(0, 4);
  const sizes = [
    { width: 84, height: 123 },
    { width: 102, height: 96 },
    { width: 107, height: 123 },
    { width: 87, height: 96 },
  ];

  if (frames.length === 0) return null;

  return (
    <div className="portfolio-awards-images-list" aria-hidden="true">
      {frames.map((src, index) => {
        const size = sizes[index] || sizes[0];
        return (
          <span
            key={`${src}-${index}`}
            className="portfolio-awards-images-list__item"
            style={{
              width: size.width,
              height: size.height,
              backgroundImage: `url(${src})`,
            }}
          />
        );
      })}
    </div>
  );
}
