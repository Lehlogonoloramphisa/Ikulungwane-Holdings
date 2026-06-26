import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Image, Briefcase, CalendarCheck, MessageSquare, Users,
  FileText, Star, Settings, Menu, ChevronRight, LogOut, LayoutTemplate,
  ArrowUpRight, ShieldCheck
} from "lucide-react";
import { ADMIN_SEEDED_QUERY_KEYS, seedStarterContent } from "@/lib/adminSeed";
import { applyBrandingVariables } from "@/lib/branding";
import { useAuth } from "@/lib/AuthContext";
import { useCms } from "@/lib/cms";

const NAV_GROUPS = [
  {
    label: "Studio",
    items: [
      { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/admin/page-builder", icon: LayoutTemplate, label: "Page Builder" },
    ],
  },
  {
    label: "Content",
    items: [
      { path: "/admin/portfolio", icon: Image, label: "Portfolio" },
      { path: "/admin/services", icon: Briefcase, label: "Services" },
      { path: "/admin/testimonials", icon: Star, label: "Testimonials" },
      { path: "/admin/blog", icon: FileText, label: "Journal" },
      { path: "/admin/team", icon: Users, label: "Team" },
    ],
  },
  {
    label: "Clients",
    items: [
      { path: "/admin/bookings", icon: CalendarCheck, label: "Bookings" },
      { path: "/admin/leads", icon: MessageSquare, label: "Leads" },
    ],
  },
  {
    label: "System",
    items: [
      { path: "/admin/legal", icon: ShieldCheck, label: "Legal" },
      { path: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

const isActivePath = (pathname, path) => (
  path === "/admin" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`)
);

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();
  const { logout, user } = useAuth();
  const cms = useCms();
  const currentPage = NAV_ITEMS.find((item) => isActivePath(location.pathname, item.path));

  const handleLogout = () => {
    logout(false);
    window.location.href = "/admin/login";
  };

  useEffect(() => {
    applyBrandingVariables(cms.global.branding);
  }, [cms.global.branding]);

  useEffect(() => {
    let mounted = true;

    seedStarterContent()
      .then((seeded) => {
        if (!mounted || !seeded) return;

        ADMIN_SEEDED_QUERY_KEYS.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [queryClient]);

  return (
    <div className="admin-shell min-h-screen flex">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar fixed lg:sticky inset-y-0 left-0 top-0 z-50 w-[292px] flex flex-col transition-transform duration-300 lg:h-screen lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-4">
          <Link to="/admin" className="admin-brand-card group">
            <span className="admin-brand-mark">IK</span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.34em] text-primary">Admin Suite</span>
              <span className="mt-1 block truncate text-lg font-black uppercase tracking-[0.08em] text-white">Ikulungwane</span>
            </span>
            <ArrowUpRight className="ml-auto h-4 w-4 text-white/30 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </div>

        <div className="mx-4 mb-4 grid grid-cols-2 gap-2">
          <div className="admin-mini-tile">
            <span>CMS</span>
            <strong>Live</strong>
          </div>
          <div className="admin-mini-tile">
            <span>Mode</span>
            <strong>Studio</strong>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="admin-nav-kicker">{group.label}</p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const active = isActivePath(location.pathname, item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`admin-nav-link ${active ? "is-active" : ""}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4">
          <div className="admin-sidebar-footer">
            <div className="flex items-center gap-3">
              <span className="admin-status-dot" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">Studio Ready</p>
                <p className="mt-1 max-w-[190px] truncate text-xs text-white/40">{user?.email || "Premium content control"}</p>
              </div>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="admin-site-link admin-logout-link">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <Link to="/" className="admin-site-link">
            View Site
            <ArrowUpRight className="ml-auto h-4 w-4" />
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="admin-topbar sticky top-0 z-30 px-4 py-4 sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="admin-icon-button lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/35">
              <span>Admin</span>
              <ChevronRight className="h-3 w-3" />
              <span className="truncate text-white/70">{currentPage?.label || "Page"}</span>
            </div>
            <h1 className="mt-1 truncate text-lg font-black uppercase tracking-[0.08em] text-white sm:text-xl">
              {currentPage?.label || "Studio Console"}
            </h1>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="admin-trust-pill">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Content secured
            </div>
            <Link to="/" className="admin-top-link">
              View live site
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button type="button" onClick={handleLogout} className="admin-icon-button" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="admin-main flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
