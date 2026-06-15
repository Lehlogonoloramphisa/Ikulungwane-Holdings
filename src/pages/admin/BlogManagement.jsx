import React, { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { linesToList, listToLines, slugify } from "@/lib/adminHelpers";

const CATEGORIES = ["tips", "behind_the_scenes", "gear", "weddings", "events", "news"];
const empty = { title: "", slug: "", excerpt: "", content: "", featured_image: "", category: "news", tags: [], author: "", published: false, meta_title: "", meta_description: "" };

export default function BlogManagement() {
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: posts } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: () => localApi.entities.BlogPost.list("-created_date", 100),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, slug: data.slug || slugify(data.title) };
      return payload.id ? localApi.entities.BlogPost.update(payload.id, payload) : localApi.entities.BlogPost.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog"] }); setDialogOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.BlogPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog"] }),
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await localApi.integrations.Core.UploadFile({ file });
    setEditing((prev) => ({ ...prev, featured_image: file_url }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Blog Posts</h1>
        <button onClick={() => { setEditing({ ...empty }); setDialogOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-obsidian text-sm font-body font-semibold uppercase tracking-wider">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="p-5 border border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {post.featured_image && <img src={post.featured_image} alt="" className="w-16 h-16 object-cover flex-shrink-0" />}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-body font-medium truncate">{post.title}</h3>
                  {!post.published && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] uppercase tracking-wider">Draft</span>}
                </div>
                <p className="text-white/30 text-xs font-body mt-1">{post.category?.replace(/_/g, " ")} / {post.created_date ? format(new Date(post.created_date), "MMM d, yyyy") : ""}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setEditing({ ...post }); setDialogOpen(true); }} className="p-2 text-white/40 hover:text-primary transition-colors"><Edit className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(post.id); }} className="p-2 text-white/40 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="py-16 text-center text-white/30 text-sm font-body">No blog posts yet</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-xl text-white">{editing?.id ? "Edit" : "New"} Post</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4 mt-4">
              <Input placeholder="Post Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input placeholder="URL Slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#222] border-white/10 text-white">{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Author" value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Textarea placeholder="Tags (one per line)" value={listToLines(editing.tags)} onChange={(e) => setEditing({ ...editing, tags: linesToList(e.target.value) })} className="bg-white/5 border-white/10 text-white" />
              <Textarea placeholder="Excerpt" value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Textarea placeholder="Content (markdown)" value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} className="bg-white/5 border-white/10 text-white min-h-[200px]" />
              <div>
                <Label className="text-white/60 text-sm mb-2 block">Featured Image</Label>
                {editing.featured_image && <img src={editing.featured_image} alt="" className="w-full h-32 object-cover mb-2" />}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-white/50 text-sm" />
              </div>
              <Input placeholder="Meta Title (SEO)" value={editing.meta_title} onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input placeholder="Meta Description (SEO)" value={editing.meta_description} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <div className="flex items-center gap-2"><Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} /><Label className="text-white/60 text-sm">Published</Label></div>
              <button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending} className="w-full py-3 bg-primary text-obsidian font-body font-semibold uppercase tracking-wider text-sm disabled:opacity-50">
                {saveMutation.isPending ? "Saving..." : "Save Post"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
