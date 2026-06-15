import React, { useState } from "react";
import { Plus, Edit, Trash2, Image, Star } from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/adminHelpers";

const CATEGORIES = ["weddings", "events", "corporate", "graduations", "product", "lifestyle", "videography"];

const emptyProject = {
  title: "", slug: "", category: "weddings", cover_image: "", description: "",
  images: [], video_url: "", client_name: "", client_testimonial: "",
  location: "", date: "", featured: false, published: true, metadata: "",
};

export default function PortfolioManagement() {
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["admin-portfolio"],
    queryFn: () => localApi.entities.PortfolioProject.list("-created_date", 100),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, slug: data.slug || slugify(data.title) };
      if (payload.id) return localApi.entities.PortfolioProject.update(payload.id, payload);
      return localApi.entities.PortfolioProject.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] }); setDialogOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.PortfolioProject.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] }),
  });

  const handleNew = () => { setEditing({ ...emptyProject }); setDialogOpen(true); };
  const handleEdit = (project) => { setEditing({ ...project }); setDialogOpen(true); };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await localApi.integrations.Core.UploadFile({ file });
    setEditing((prev) => ({ ...prev, cover_image: file_url }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Portfolio</h1>
          <p className="text-white/40 text-sm font-body mt-1">{projects.length} projects</p>
        </div>
        <button onClick={handleNew} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-obsidian text-sm font-body font-semibold uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="border border-white/5 bg-white/[0.02] overflow-hidden group">
            <div className="aspect-video relative">
              {project.cover_image ? (
                <img src={project.cover_image} alt={project.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <Image className="w-8 h-8 text-white/20" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {project.featured && <span className="px-2 py-0.5 bg-primary/90 text-obsidian text-[10px] uppercase tracking-wider font-body"><Star className="w-3 h-3 inline" /></span>}
                {!project.published && <span className="px-2 py-0.5 bg-red-500/90 text-white text-[10px] uppercase tracking-wider font-body">Draft</span>}
              </div>
            </div>
            <div className="p-4">
              <p className="text-primary text-[10px] uppercase tracking-wider font-body">{project.category}</p>
              <h3 className="text-white font-body font-medium mt-1">{project.title}</h3>
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleEdit(project)} className="flex items-center gap-1 px-3 py-1.5 border border-white/10 text-white/60 text-xs hover:border-primary hover:text-primary transition-all">
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => { if (confirm("Delete this project?")) deleteMutation.mutate(project.id); }} className="flex items-center gap-1 px-3 py-1.5 border border-white/10 text-red-400/60 text-xs hover:border-red-400 hover:text-red-400 transition-all">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {projects.length === 0 && <p className="py-16 text-center text-white/30 text-sm font-body">No portfolio projects yet</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-white">
              {editing?.id ? "Edit Project" : "New Project"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 mt-4">
              <Input placeholder="Project Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input placeholder="URL Slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#222] border-white/10 text-white">
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea placeholder="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="bg-white/5 border-white/10 text-white min-h-[100px]" />
              
              <div>
                <Label className="text-white/60 text-sm mb-2 block">Cover Image</Label>
                {editing.cover_image && <img src={editing.cover_image} alt="" className="w-full h-40 object-cover mb-2" />}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-white/50 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Client Name" value={editing.client_name} onChange={(e) => setEditing({ ...editing, client_name: e.target.value })} className="bg-white/5 border-white/10 text-white" />
                <Input placeholder="Location" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              </div>
              <Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input placeholder="Video URL" value={editing.video_url} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} className="bg-white/5 border-white/10 text-white" />

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} />
                  <Label className="text-white/60 text-sm">Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} />
                  <Label className="text-white/60 text-sm">Published</Label>
                </div>
              </div>

              <button
                onClick={() => saveMutation.mutate(editing)}
                disabled={saveMutation.isPending}
                className="w-full py-3 bg-primary text-obsidian font-body font-semibold uppercase tracking-wider text-sm disabled:opacity-50"
              >
                {saveMutation.isPending ? "Saving..." : "Save Project"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
