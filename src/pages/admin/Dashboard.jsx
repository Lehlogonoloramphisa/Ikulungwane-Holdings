import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarCheck,
  Camera,
  CheckCircle2,
  Image,
  LayoutTemplate,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { normalizeMediaUrl } from "@/lib/media";

const formatDate = (value, fallback = "Date TBD") => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : format(date, "MMM d, yyyy");
};

const statusColors = {
  new: "bg-blue-500/15 text-blue-200 border-blue-300/20",
  pending_review: "bg-yellow-500/15 text-yellow-100 border-yellow-300/20",
  quotation_sent: "bg-purple-500/15 text-purple-100 border-purple-300/20",
  confirmed: "bg-green-500/15 text-green-100 border-green-300/20",
  completed: "bg-emerald-500/15 text-emerald-100 border-emerald-300/20",
  cancelled: "bg-red-500/15 text-red-100 border-red-300/20",
};

export default function Dashboard() {
  const { data: bookings } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => localApi.entities.Booking.list("-created_date", 50),
    initialData: [],
  });

  const { data: leads } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => localApi.entities.ContactMessage.list("-created_date", 50),
    initialData: [],
  });

  const { data: projects } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => localApi.entities.PortfolioProject.list("-created_date", 50),
    initialData: [],
  });

  const newThisMonth = bookings.filter((booking) => {
    const date = new Date(booking.created_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed").length;
  const openLeads = leads.filter((lead) => lead.status !== "archived" && lead.status !== "resolved").length;

  const stats = [
    { icon: CalendarCheck, label: "Total Bookings", value: bookings.length, meta: `${confirmedBookings} confirmed`, tone: "gold" },
    { icon: MessageSquare, label: "Open Enquiries", value: openLeads, meta: `${leads.length} all time`, tone: "teal" },
    { icon: Image, label: "Portfolio Projects", value: projects.length, meta: "curated stories", tone: "white" },
    { icon: TrendingUp, label: "New This Month", value: newThisMonth, meta: "fresh demand", tone: "gold" },
  ];

  const recentBookings = bookings.slice(0, 5);
  const recentLeads = leads.slice(0, 5);
  const latestProjects = projects.slice(0, 3);

  const quickActions = [
    { icon: LayoutTemplate, label: "Edit pages", path: "/admin/page-builder" },
    { icon: Camera, label: "Add work", path: "/admin/portfolio" },
    { icon: CalendarCheck, label: "Review bookings", path: "/admin/bookings" },
  ];

  return (
    <div className="admin-dashboard space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-hero-panel"
      >
        <div className="max-w-3xl">
          <p className="admin-eyebrow">Studio command center</p>
          <h2>Control the brand, bookings, and content from one refined space.</h2>
          <p className="admin-hero-copy">
            A focused overview for the Ikulungwane team: current demand, active conversations,
            portfolio depth, and the fastest paths into content updates.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/admin/page-builder" className="admin-hero-cta">
              <LayoutTemplate className="h-4 w-4" />
              Open page builder
            </Link>
            <Link to="/admin/bookings" className="admin-ghost-cta">
              Bookings
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="admin-hero-score">
          <div>
            <span>Current Month</span>
            <strong>{newThisMonth}</strong>
            <em>new booking requests</em>
          </div>
          <div>
            <span>Creative Library</span>
            <strong>{projects.length}</strong>
            <em>published visual stories</em>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`admin-stat-card is-${stat.tone}`}
          >
            <div className="flex items-start justify-between gap-4">
              <stat.icon className="h-5 w-5" />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <p>{stat.value}</p>
            <strong>{stat.label}</strong>
            <em>{stat.meta}</em>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <p className="admin-eyebrow">Pipeline</p>
              <h3>Recent Bookings</h3>
            </div>
            <Link to="/admin/bookings" className="admin-panel-link">
              Manage
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="admin-activity-list">
            {recentBookings.length === 0 ? (
              <div className="admin-empty-state">
                <CalendarCheck className="h-6 w-6" />
                <p>No bookings yet</p>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking.id} className="admin-activity-row">
                  <div className="admin-activity-icon">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p>{booking.full_name || "Unnamed client"}</p>
                    <span>{booking.event_type || "Session"} / {formatDate(booking.event_date)}</span>
                  </div>
                  <span className={`admin-status-chip ${statusColors[booking.status] || "bg-white/10 text-white/60 border-white/10"}`}>
                    {booking.status?.replace(/_/g, " ") || "new"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <p className="admin-eyebrow">Inbox</p>
                <h3>Recent Enquiries</h3>
              </div>
              <Link to="/admin/leads" className="admin-panel-link">
                Open
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="admin-activity-list is-compact">
              {recentLeads.length === 0 ? (
                <div className="admin-empty-state">
                  <MessageSquare className="h-6 w-6" />
                  <p>No enquiries yet</p>
                </div>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="admin-activity-row">
                    <div className="admin-activity-icon">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p>{lead.name || "New enquiry"}</p>
                      <span className="line-clamp-1">{lead.message || lead.email}</span>
                    </div>
                    <span className={`admin-status-chip ${statusColors[lead.status] || "bg-blue-500/15 text-blue-100 border-blue-300/20"}`}>
                      {lead.status || "new"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="admin-quick-panel">
            <div>
              <p className="admin-eyebrow">Fast actions</p>
              <h3>Move quickly</h3>
            </div>
            <div className="mt-5 grid gap-2">
              {quickActions.map((action) => (
                <Link key={action.path} to={action.path} className="admin-quick-link">
                  <action.icon className="h-4 w-4" />
                  {action.label}
                  <ArrowUpRight className="ml-auto h-4 w-4" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <p className="admin-eyebrow">Creative inventory</p>
            <h3>Latest Portfolio Stories</h3>
          </div>
          <Link to="/admin/portfolio" className="admin-panel-link">
            Portfolio
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="admin-project-strip">
          {latestProjects.length === 0 ? (
            <div className="admin-empty-state">
              <Sparkles className="h-6 w-6" />
              <p>No portfolio projects yet</p>
            </div>
          ) : (
            latestProjects.map((project) => (
              <Link key={project.id} to="/admin/portfolio" className="admin-project-preview">
                <div>
                  {normalizeMediaUrl(project.cover_image) ? (
                    <img src={normalizeMediaUrl(project.cover_image)} alt={project.title} />
                  ) : (
                    <Image className="h-7 w-7 text-white/25" />
                  )}
                </div>
                <span>{project.category || "portfolio"}</span>
                <strong>{project.title || "Untitled project"}</strong>
                <em>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {project.published === false ? "Draft" : "Published"}
                </em>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
