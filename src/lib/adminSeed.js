import { localApi } from "@/api/localClient";
import {
  starterBlogPosts,
  starterPortfolioProjects,
  starterServices,
  starterTeamMembers,
  starterTestimonials,
} from "@/data/adminStarterContent";

const ADMIN_SEED_KEY = "ikulungwane_admin_starter_seed_v1";

const SEED_CONFIG = [
  { entity: "PortfolioProject", items: starterPortfolioProjects },
  { entity: "Service", items: starterServices },
  { entity: "Testimonial", items: starterTestimonials },
  { entity: "BlogPost", items: starterBlogPosts },
  { entity: "TeamMember", items: starterTeamMembers },
];

let seedPromise = null;

export const ADMIN_SEEDED_QUERY_KEYS = [
  "admin-portfolio",
  "portfolio",
  "featured-projects",
  "admin-services",
  "services",
  "admin-testimonials",
  "testimonials-featured",
  "admin-blog",
  "blog-posts",
  "blog-post-detail",
  "admin-team",
  "team",
  "admin-projects",
];

const getStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const runStarterSeed = async () => {
  const storage = getStorage();
  if (!storage || storage.getItem(ADMIN_SEED_KEY)) {
    return false;
  }

  storage.setItem(
    ADMIN_SEED_KEY,
    JSON.stringify({ seeded: false, started_at: new Date().toISOString() })
  );

  let seeded = false;

  try {
    for (const { entity, items } of SEED_CONFIG) {
      const existing = await localApi.entities[entity].list(undefined, 1);
      if (existing.length > 0) continue;

      for (const item of items) {
        await localApi.entities[entity].create(item);
      }

      seeded = true;
    }

    storage.setItem(
      ADMIN_SEED_KEY,
      JSON.stringify({ seeded, seeded_at: new Date().toISOString() })
    );

    return seeded;
  } catch (error) {
    storage.removeItem(ADMIN_SEED_KEY);
    throw error;
  }
};

export const seedStarterContent = () => {
  if (!seedPromise) {
    seedPromise = runStarterSeed().finally(() => {
      seedPromise = null;
    });
  }

  return seedPromise;
};
