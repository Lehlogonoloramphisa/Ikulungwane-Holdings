import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AshleyEffects from "./AshleyEffects";
import ScrollPresenceEffects from "./ScrollPresenceEffects";
import { useCms } from "@/lib/cms";
import { applyBrandingVariables } from "@/lib/branding";

const upsertMeta = (selector, attributes) => {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value || "");
  });
};

const upsertLink = (selector, attributes) => {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value || "");
  });
};

export default function SiteLayout() {
  const cms = useCms();

  useEffect(() => {
    const { site, branding } = cms.global;
    applyBrandingVariables(branding);
    document.title = site.metaTitle;

    upsertMeta('meta[name="description"]', { name: "description", content: site.metaDescription });
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: site.keywords || "" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: site.metaTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: site.metaDescription });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: site.openGraphImage || "" });
    upsertMeta('meta[name="theme-color"]', { name: "theme-color", content: branding.primaryColor || branding.accentColor || "#050505" });

    if (site.favicon) {
      upsertLink('link[rel="icon"]', { rel: "icon", href: site.favicon });
    } else {
      document.querySelector('link[rel="icon"]')?.remove();
    }
  }, [cms.global]);

  return (
    <div className="ashley-shell min-h-screen bg-black text-white">
      <AshleyEffects settings={cms.global.animations} />
      <ScrollPresenceEffects enabled={cms.global.animations?.sectionEntrances !== false} />
      <Navbar />
      <main className="ashley-frame">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
