import React from "react";
import { motion } from "framer-motion";

export default function PageHero({ title, subtitle, image, height = "min-h-[46svh]" }) {
  return (
    <section className={`ashley-section relative ${height} flex items-end overflow-hidden bg-black pb-14 pt-32`}>
      {image ? (
        <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-30" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_20%,rgba(225,29,46,0.12),transparent_32%)]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.96),rgba(0,0,0,0.72),rgba(0,0,0,0.9))]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="ashley-kicker mb-5"
          >
            {subtitle}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="ashley-display max-w-4xl text-5xl font-bold text-white md:text-7xl"
        >
          {title}
        </motion.h1>
      </div>
    </section>
  );
}
