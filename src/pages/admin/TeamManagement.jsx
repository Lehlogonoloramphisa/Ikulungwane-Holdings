import React, { useState } from "react";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminMediaField from "@/components/admin/AdminMediaField";
import { linesToList, listToLines } from "@/lib/adminHelpers";
import { normalizeMediaUrl } from "@/lib/media";

const empty = { name: "", role: "", bio: "", photo: "", specialties: [], social_instagram: "", social_linkedin: "", order: 0, published: true };

export default function TeamManagement() {
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: members } = useQuery({
    queryKey: ["admin-team"],
    queryFn: () => localApi.entities.TeamMember.list("order", 50),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id ? localApi.entities.TeamMember.update(data.id, data) : localApi.entities.TeamMember.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-team"] }); setDialogOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.TeamMember.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-team"] }),
  });

  return (
    <div className="admin-list-page">
      <AdminPageHeader
        eyebrow="Content"
        title="Team"
        description="Manage team profiles, roles, photos, specialties, and display order."
        count={`${members.length} members`}
        actions={(
          <button onClick={() => { setEditing({ ...empty }); setDialogOpen(true); }} className="admin-primary-action">
          <Plus className="w-4 h-4" /> Add Member
          </button>
        )}
      />

      <div className="admin-collection-grid">
        {members.map((m) => (
          <article key={m.id} className="admin-content-card">
            <div className="aspect-square relative">
              {normalizeMediaUrl(m.photo) ? (
                <img src={normalizeMediaUrl(m.photo)} alt={m.name} className="w-full h-full object-contain bg-black/35" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center"><Users className="w-12 h-12 text-white/20" /></div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-white font-body font-medium">{m.name}</h3>
              <p className="text-primary text-xs uppercase tracking-wider font-body">{m.role}</p>
              <div className="admin-record-actions">
                <button onClick={() => { setEditing({ ...m }); setDialogOpen(true); }}><Edit className="w-3 h-3" /> Edit</button>
                <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(m.id); }} className="is-danger"><Trash2 className="w-3 h-3" /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {members.length === 0 && <p className="admin-empty-copy">No team members yet</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-xl text-white">{editing?.id ? "Edit" : "New"} Team Member</DialogTitle></DialogHeader>
          {editing && (
            <div className="admin-dialog-form">
              <Input placeholder="Full Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input placeholder="Role / Title" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Textarea placeholder="Bio" value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Textarea placeholder="Specialties (one per line)" value={listToLines(editing.specialties)} onChange={(e) => setEditing({ ...editing, specialties: linesToList(e.target.value) })} className="bg-white/5 border-white/10 text-white" />
              <AdminMediaField
                label="Photo"
                value={editing.photo}
                recommendedSize="1200 x 1200 px or portrait image"
                help="Used on the public About page and admin team list."
                onChange={(fileUrl) => setEditing({ ...editing, photo: fileUrl })}
              />
              <Input placeholder="Instagram URL" value={editing.social_instagram} onChange={(e) => setEditing({ ...editing, social_instagram: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input placeholder="LinkedIn URL" value={editing.social_linkedin} onChange={(e) => setEditing({ ...editing, social_linkedin: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input type="number" placeholder="Display Order" value={editing.order} onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white" />
              <div className="flex items-center gap-2"><Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} /><Label className="text-white/60 text-sm">Published</Label></div>
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
