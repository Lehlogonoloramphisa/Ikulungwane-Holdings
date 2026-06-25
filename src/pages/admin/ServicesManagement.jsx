import React, { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminMediaField from "@/components/admin/AdminMediaField";
import { linesToList, listToLines, slugify } from "@/lib/adminHelpers";
import { normalizeMediaUrl } from "@/lib/media";

const empty = { title: "", slug: "", description: "", long_description: "", cover_image: "", packages: [], faqs: [], published: true, order: 0 };

export default function ServicesManagement() {
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => localApi.entities.Service.list("order", 50),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, slug: data.slug || slugify(data.title) };
      return payload.id ? localApi.entities.Service.update(payload.id, payload) : localApi.entities.Service.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-services"] }); setDialogOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.Service.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-services"] }),
  });

  const addPackage = () => {
    setEditing((prev) => ({ ...prev, packages: [...(prev.packages || []), { name: "", price: "", features: [""] }] }));
  };

  const updatePackage = (idx, field, value) => {
    setEditing((prev) => {
      const pkgs = [...(prev.packages || [])];
      pkgs[idx] = { ...pkgs[idx], [field]: value };
      return { ...prev, packages: pkgs };
    });
  };

  const removePackage = (idx) => {
    setEditing((prev) => ({ ...prev, packages: prev.packages.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="admin-list-page">
      <AdminPageHeader
        eyebrow="Content"
        title="Services"
        description="Edit service pages, packages, pricing notes, and the services shown on the website."
        count={`${services.length} services`}
        actions={(
          <button onClick={() => { setEditing({ ...empty }); setDialogOpen(true); }} className="admin-primary-action">
          <Plus className="w-4 h-4" /> Add Service
          </button>
        )}
      />

      <div className="admin-list-stack">
        {services.map((s) => (
          <article key={s.id} className="admin-list-card">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {normalizeMediaUrl(s.cover_image) && <img src={normalizeMediaUrl(s.cover_image)} alt="" className="w-16 h-16 object-contain bg-black/35 flex-shrink-0" />}
              <div className="min-w-0">
                <h3 className="text-white font-body font-medium">{s.title}</h3>
                <p className="text-white/30 text-xs font-body">{s.packages?.length || 0} packages</p>
              </div>
            </div>
            <div className="admin-icon-actions">
              <button onClick={() => { setEditing({ ...s }); setDialogOpen(true); }} aria-label={`Edit ${s.title}`}><Edit className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(s.id); }} className="is-danger" aria-label={`Delete ${s.title}`}><Trash2 className="w-4 h-4" /></button>
            </div>
          </article>
        ))}
        {services.length === 0 && <p className="admin-empty-copy">No services yet. Default services will show on the website.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-xl text-white">{editing?.id ? "Edit" : "New"} Service</DialogTitle></DialogHeader>
          {editing && (
            <div className="admin-dialog-form">
              <Input placeholder="Service Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input placeholder="URL Slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Textarea placeholder="Short Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Textarea placeholder="Long Description" value={editing.long_description} onChange={(e) => setEditing({ ...editing, long_description: e.target.value })} className="bg-white/5 border-white/10 text-white min-h-[120px]" />
              <AdminMediaField
                label="Cover Image"
                value={editing.cover_image}
                recommendedSize="1600 x 1000 px or larger"
                help="Used on services pages and home service previews."
                onChange={(fileUrl) => setEditing({ ...editing, cover_image: fileUrl })}
              />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-white/60 text-sm">Pricing Packages</Label>
                  <button onClick={addPackage} className="text-primary text-xs uppercase tracking-wider font-body hover:underline">+ Add Package</button>
                </div>
                {editing.packages?.map((pkg, i) => (
                  <div key={i} className="admin-nested-editor">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">Package {i + 1}</span>
                      <button onClick={() => removePackage(i)} className="text-red-400/60 text-xs hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <Input placeholder="Package Name" value={pkg.name} onChange={(e) => updatePackage(i, "name", e.target.value)} className="bg-white/5 border-white/10 text-white" />
                    <Input placeholder="Price (e.g. R5,000)" value={pkg.price} onChange={(e) => updatePackage(i, "price", e.target.value)} className="bg-white/5 border-white/10 text-white" />
                    <Textarea placeholder="Features (one per line)" value={listToLines(pkg.features)} onChange={(e) => updatePackage(i, "features", linesToList(e.target.value))} className="bg-white/5 border-white/10 text-white text-sm" />
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2"><Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} /><Label className="text-white/60 text-sm">Published</Label></div>
                <Input type="number" placeholder="Order" value={editing.order} onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white w-24" />
              </div>
              <button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending} className="w-full py-3 bg-primary text-obsidian font-body font-semibold uppercase tracking-wider text-sm disabled:opacity-50">
                {saveMutation.isPending ? "Saving..." : "Save Service"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
