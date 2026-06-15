import React, { useState } from "react";
import { Mail, Phone, Search, Trash2 } from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = ["new", "contacted", "qualified", "converted", "closed"];
const statusColors = {
  new: "bg-blue-500/20 text-blue-400",
  contacted: "bg-yellow-500/20 text-yellow-400",
  qualified: "bg-purple-500/20 text-purple-400",
  converted: "bg-green-500/20 text-green-400",
  closed: "bg-red-500/20 text-red-400",
};

export default function LeadsManagement() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: leads } = useQuery({
    queryKey: ["admin-leads-all"],
    queryFn: () => localApi.entities.ContactMessage.list("-created_date", 200),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localApi.entities.ContactMessage.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-leads-all"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.ContactMessage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-leads-all"] }),
  });

  const filtered = leads.filter((lead) => {
    const status = lead.status || "new";
    const query = search.toLowerCase();
    const matchStatus = filter === "all" || status === filter;
    const matchSearch = !query
      || String(lead.name || "").toLowerCase().includes(query)
      || String(lead.email || "").toLowerCase().includes(query)
      || String(lead.phone || "").toLowerCase().includes(query)
      || String(lead.message || "").toLowerCase().includes(query)
      || String(lead.service_interested || "").toLowerCase().includes(query);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Leads & Enquiries</h1>
          <p className="text-white/40 text-sm font-body mt-1">{filtered.length} enquiries</p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search enquiries..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`px-3 py-2 text-xs uppercase tracking-wider font-body border transition-all ${filter === "all" ? "border-primary text-primary" : "border-white/10 text-white/40"}`}>All</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 text-xs uppercase tracking-wider font-body border transition-all ${filter === s ? "border-primary text-primary" : "border-white/10 text-white/40"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((lead) => (
          <div key={lead.id} className="p-5 border border-white/5 bg-white/[0.02]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-white font-body font-medium">{lead.name}</p>
                <p className="text-white/40 text-xs font-body">{lead.email} {lead.phone ? `/ ${lead.phone}` : ""}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider ${statusColors[lead.status || "new"]}`}>
                  {lead.status || "new"}
                </span>
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="text-white/40 hover:text-primary" aria-label={`Email ${lead.name || "lead"}`}>
                    <Mail className="h-4 w-4" />
                  </a>
                )}
                {lead.phone && (
                  <a href={`tel:${String(lead.phone).replace(/\s/g, "")}`} className="text-white/40 hover:text-primary" aria-label={`Call ${lead.name || "lead"}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                )}
                <Select value={lead.status || "new"} onValueChange={(v) => updateMutation.mutate({ id: lead.id, data: { status: v } })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#222] border-white/10 text-white">
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => { if (confirm("Delete this enquiry?")) deleteMutation.mutate(lead.id); }}
                  className="text-white/40 hover:text-red-400"
                  aria-label={`Delete ${lead.name || "lead"}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {lead.service_interested && <p className="text-primary text-xs uppercase tracking-wider font-body mt-2">Interested in: {lead.service_interested}</p>}
            <p className="text-white/50 text-sm font-body mt-2 leading-relaxed">{lead.message}</p>
            <p className="text-white/20 text-xs font-body mt-3">{lead.created_date ? format(new Date(lead.created_date), "MMM d, yyyy 'at' HH:mm") : ""}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-16 text-center text-white/30 text-sm font-body">No enquiries found</p>}
      </div>
    </div>
  );
}
