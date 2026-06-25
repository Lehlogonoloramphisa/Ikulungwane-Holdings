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
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminMediaField from "@/components/admin/AdminMediaField";
import { linesToList, listToLines, slugify } from "@/lib/adminHelpers";
import { normalizeMediaUrl } from "@/lib/media";

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

  return (
    <div className="admin-list-page">
      <AdminPageHeader
        eyebrow="Content"
        title="Journal"
        description="Write and organise articles, SEO snippets, tags, and publishing status."
        count={`${posts.length} posts`}
        actions={(
          <button onClick={() => { setEditing({ ...empty }); setDialogOpen(true); }} className="admin-primary-action">
          <Plus className="w-4 h-4" /> New Post
          </button>
        )}
      />

      <div className="admin-list-stack">
        {posts.map((post) => (
          <article key={post.id} className="admin-list-card">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {normalizeMediaUrl(post.featured_image) && <img src={normalizeMediaUrl(post.featured_image)} alt="" className="w-16 h-16 object-contain bg-black/35 flex-shrink-0" />}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-body font-medium truncate">{post.title}</h3>
                  {!post.published && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] uppercase tracking-wider">Draft</span>}
                </div>
                <p className="text-white/30 text-xs font-body mt-1">{post.category?.replace(/_/g, " ")} / {post.created_date ? format(new Date(post.created_date), "MMM d, yyyy") : ""}</p>
              </div>
            </div>
            <div className="admin-icon-actions">
              <button onClick={() => { setEditing({ ...post }); setDialogOpen(true); }} aria-label={`Edit ${post.title}`}><Edit className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(post.id); }} className="is-danger" aria-label={`Delete ${post.title}`}><Trash2 className="w-4 h-4" /></button>
            </div>
          </article>
        ))}
        {posts.length === 0 && <p className="admin-empty-copy">No blog posts yet</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-xl text-white">{editing?.id ? "Edit" : "New"} Post</DialogTitle></DialogHeader>
          {editing && (
            <div className="admin-dialog-form">
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
              <AdminMediaField
                label="Featured Image"
                value={editing.featured_image}
                recommendedSize="1600 x 900 px or larger"
                help="Used on journal index, article hero, and social previews."
                onChange={(fileUrl) => setEditing({ ...editing, featured_image: fileUrl })}
              />
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
