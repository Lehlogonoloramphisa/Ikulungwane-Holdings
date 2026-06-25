import React, { useState } from "react";
import { Search, Download } from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { csvEscape } from "@/lib/adminHelpers";

const STATUSES = ["new", "pending_review", "quotation_sent", "confirmed", "completed", "cancelled"];

const statusColors = {
  new: "bg-blue-500/20 text-blue-400",
  pending_review: "bg-yellow-500/20 text-yellow-400",
  quotation_sent: "bg-purple-500/20 text-purple-400",
  confirmed: "bg-green-500/20 text-green-400",
  completed: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function BookingsManagement() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: bookings } = useQuery({
    queryKey: ["admin-bookings-all"],
    queryFn: () => localApi.entities.Booking.list("-created_date", 200),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localApi.entities.Booking.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-bookings-all"] }); },
  });

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "all" || b.status === filter;
    const query = search.toLowerCase();
    const matchSearch = !query
      || String(b.full_name || "").toLowerCase().includes(query)
      || String(b.email || "").toLowerCase().includes(query)
      || String(b.reference || "").toLowerCase().includes(query);
    return matchStatus && matchSearch;
  });

  const exportCSV = () => {
    const headers = ["Reference", "Name", "Email", "Phone", "Event Type", "Date", "Location", "Budget", "Status"];
    const rows = filtered.map((b) => [b.reference, b.full_name, b.email, b.phone, b.event_type, b.event_date, b.event_location, b.budget_range, b.status]);
    const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "bookings.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-list-page">
      <AdminPageHeader
        eyebrow="Clients"
        title="Bookings"
        description="Review session requests, update booking status, and export the current list."
        count={`${filtered.length} bookings`}
        actions={(
          <button onClick={exportCSV} className="admin-secondary-action">
          <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      />

      <div className="admin-toolbar">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white text-sm font-body placeholder:text-white/30 focus:outline-none focus:border-primary/50" />
        </div>
        <div className="admin-filter-group">
          <button onClick={() => setFilter("all")} className={`admin-filter-button ${filter === "all" ? "is-active" : ""}`}>All</button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`admin-filter-button ${filter === s ? "is-active" : ""}`}>
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-white/5 text-white/40">
              <th className="text-left p-4 font-medium">Reference</th>
              <th className="text-left p-4 font-medium">Client</th>
              <th className="text-left p-4 font-medium">Event</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Budget</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 text-primary">{b.reference}</td>
                <td className="p-4">
                  <p className="text-white">{b.full_name}</p>
                  <p className="text-white/30 text-xs">{b.email}</p>
                </td>
                <td className="p-4 text-white/60">{b.event_type}</td>
                <td className="p-4 text-white/60">{b.event_date || "TBD"}</td>
                <td className="p-4 text-white/60">{b.budget_range || "-"}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider ${statusColors[b.status] || "bg-white/10 text-white/50"}`}>{(b.status || "new").replace(/_/g, " ")}</span>
                </td>
                <td className="p-4">
                  <button onClick={() => setSelected(b)} className="text-white/40 hover:text-primary text-xs uppercase tracking-wider transition-colors">
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="admin-empty-copy">No bookings found</p>}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-white">Booking Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="admin-dialog-form">
              <div className="grid grid-cols-2 gap-4 text-sm font-body">
                <div><p className="text-white/40 text-xs mb-1">Reference</p><p className="text-primary">{selected.reference}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Name</p><p>{selected.full_name}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Email</p><p>{selected.email}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Phone</p><p>{selected.phone || "-"}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Event</p><p>{selected.event_type}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Date</p><p>{selected.event_date || "TBD"}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Location</p><p>{selected.event_location || "-"}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Budget</p><p>{selected.budget_range || "-"}</p></div>
              </div>
              {selected.notes && <div className="text-sm font-body"><p className="text-white/40 text-xs mb-1">Notes</p><p className="text-white/60">{selected.notes}</p></div>}
              
              <div>
                <p className="text-white/40 text-xs mb-2 font-body">Update Status</p>
                <Select value={selected.status || "new"} onValueChange={(v) => {
                  updateMutation.mutate({ id: selected.id, data: { status: v } });
                  setSelected({ ...selected, status: v });
                }}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#222] border-white/10 text-white">
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
