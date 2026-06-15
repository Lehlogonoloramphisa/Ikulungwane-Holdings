import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fallbackBlogPosts } from "@/data/fallbackContent";
import { useCms } from "@/lib/cms";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "tips", label: "Tips" },
  { key: "behind_the_scenes", label: "Behind The Scenes" },
  { key: "gear", label: "Gear" },
  { key: "weddings", label: "Weddings" },
  { key: "events", label: "Events" },
  { key: "news", label: "News" },
];

const formatDate = (date) => (date ? format(new Date(date), "MMM d, yyyy") : "Undated");

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("all");
  const cms = useCms();
  const page = cms.pages.journal;

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => localApi.entities.BlogPost.filter({ published: true }, "-created_date", 50),
    initialData: [],
  });

  const displayPosts = posts.length > 0 ? posts : fallbackBlogPosts;
  const filtered = useMemo(
    () => activeCategory === "all"
      ? displayPosts
      : displayPosts.filter((post) => post.category === activeCategory),
    [activeCategory, displayPosts],
  );

  const featured = filtered[0] || displayPosts[0];
  const rest = filtered.slice(1);

  return (
    <main className="interior-page journal-page">
      <section className="interior-hero journal-hero">
        <div className="interior-hero-copy">
          <p className="ashley-kicker">{page.hero.subtitle}</p>
          <h1>{page.hero.title}</h1>
          <span>
            {page.hero.description}
          </span>
        </div>
        {featured?.featured_image && (
          <Link to={`/blog/${featured.slug || featured.id}`} className="journal-hero-feature">
            <img src={featured.featured_image} alt={featured.title} />
            <div>
              <span>{featured.category?.replace(/_/g, " ")}</span>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
            </div>
          </Link>
        )}
      </section>

      <section className="journal-index-section">
        <div className="journal-filter-rail">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={activeCategory === cat.key ? "is-active" : ""}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="journal-empty">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="journal-empty">
            No posts in this category yet.
          </div>
        ) : (
          <div className="journal-post-stream">
            {rest.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.24 }}
                transition={{ delay: index * 0.06 }}
              >
                <Link to={`/blog/${post.slug || post.id}`}>
                  <span>{String(index + 2).padStart(2, "0")}</span>
                  <div className="journal-post-image">
                    {post.featured_image && <img src={post.featured_image} alt={post.title} />}
                  </div>
                  <div>
                    <p>{post.category?.replace(/_/g, " ")} / {formatDate(post.created_date)}</p>
                    <h2>{post.title}</h2>
                    {post.excerpt && <em>{post.excerpt}</em>}
                  </div>
                  <ArrowRight />
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
