import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AshleyEffects from "./AshleyEffects";
import ScrollPresenceEffects from "./ScrollPresenceEffects";
import MaintenancePage from "@/pages/MaintenancePage";
import { refreshCmsContent, useCms } from "@/lib/cms";
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
  const [settingsChecked, setSettingsChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    refreshCmsContent()
      .finally(() => {
        if (mounted) setSettingsChecked(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const { site, branding, maintenance } = cms.global;
    applyBrandingVariables(branding);
    const maintenanceEnabled = maintenance?.enabled === true;
    const pageTitle = maintenanceEnabled ? maintenance.metaTitle || `${site.companyName} | Maintenance` : site.metaTitle;
    const pageDescription = maintenanceEnabled ? maintenance.metaDescription || maintenance.message || site.metaDescription : site.metaDescription;

    document.title = pageTitle;

    upsertMeta('meta[name="description"]', { name: "description", content: pageDescription });
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: site.keywords || "" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: pageDescription });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: site.openGraphImage || "" });
    upsertMeta('meta[name="theme-color"]', { name: "theme-color", content: branding.primaryColor || branding.accentColor || "#050505" });

    if (site.favicon) {
      upsertLink('link[rel="icon"]', { rel: "icon", href: site.favicon });
    } else {
      document.querySelector('link[rel="icon"]')?.remove();
    }
  }, [cms.global]);

  if (!settingsChecked) {
    return (
      <div className="ashley-shell min-h-screen bg-black text-white">
        <div className="fixed inset-0 flex items-center justify-center bg-black">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
        </div>
      </div>
    );
  }

  if (cms.global.maintenance?.enabled === true) {
    return (
      <div className="ashley-shell min-h-screen bg-black text-white">
        <MaintenancePage cms={cms} />
      </div>
    );
  }

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
