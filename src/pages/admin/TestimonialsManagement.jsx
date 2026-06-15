import React, { useState } from "react";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const empty = { client_name: "", review: "", rating: 5, service_type: "", featured: false, published: true };

export default function TestimonialsManagement() {
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: testimonials } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: () => localApi.entities.Testimonial.list("-created_date", 100),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id ? localApi.entities.Testimonial.update(data.id, data) : localApi.entities.Testimonial.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] }); setDialogOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.Testimonial.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Testimonials</h1>
        <button onClick={() => { setEditing({ ...empty }); setDialogOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-obsidian text-sm font-body font-semibold uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="space-y-3">
        {testimonials.map((t) => (
          <div key={t.id} className="p-5 border border-white/5 bg-white/[0.02] flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-white font-body font-medium">{t.client_name}</p>
                {t.featured && <Star className="w-3 h-3 text-primary fill-bronze" />}
              </div>
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < t.rating ? "text-primary fill-bronze" : "text-white/20"}`} />)}
              </div>
              <p className="text-white/50 text-sm font-body leading-relaxed">"{t.review}"</p>
              {t.service_type && <p className="text-white/30 text-xs uppercase tracking-wider font-body mt-2">{t.service_type}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing({ ...t }); setDialogOpen(true); }} className="p-2 text-white/40 hover:text-primary transition-colors"><Edit className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(t.id); }} className="p-2 text-white/40 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && <p className="py-16 text-center text-white/30 text-sm font-body">No testimonials yet</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-xl text-white">{editing?.id ? "Edit" : "New"} Testimonial</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4 mt-4">
              <Input placeholder="Client Name" value={editing.client_name} onChange={(e) => setEditing({ ...editing, client_name: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input placeholder="Service Type" value={editing.service_type} onChange={(e) => setEditing({ ...editing, service_type: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <div>
                <Label className="text-white/60 text-sm mb-2 block">Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} type="button" onClick={() => setEditing({ ...editing, rating: r })}>
                      <Star className={`w-6 h-6 ${r <= editing.rating ? "text-primary fill-bronze" : "text-white/20"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea placeholder="Review text" value={editing.review} onChange={(e) => setEditing({ ...editing, review: e.target.value })} className="bg-white/5 border-white/10 text-white min-h-[100px]" />
              <div className="flex gap-6">
                <div className="flex items-center gap-2"><Switch checked={editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} /><Label className="text-white/60 text-sm">Featured</Label></div>
                <div className="flex items-center gap-2"><Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} /><Label className="text-white/60 text-sm">Published</Label></div>
              </div>
              <button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending} className="w-full py-3 bg-primary text-obsidian font-body font-semibold uppercase tracking-wider text-sm disabled:opacity-50">
                {saveMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
