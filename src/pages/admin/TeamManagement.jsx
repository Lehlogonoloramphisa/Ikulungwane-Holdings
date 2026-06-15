import React, { useState } from "react";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { linesToList, listToLines } from "@/lib/adminHelpers";

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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await localApi.integrations.Core.UploadFile({ file });
    setEditing((prev) => ({ ...prev, photo: file_url }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Team Members</h1>
        <button onClick={() => { setEditing({ ...empty }); setDialogOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-obsidian text-sm font-body font-semibold uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <div key={m.id} className="border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="aspect-square relative">
              {m.photo ? (
                <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center"><Users className="w-12 h-12 text-white/20" /></div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-white font-body font-medium">{m.name}</h3>
              <p className="text-primary text-xs uppercase tracking-wider font-body">{m.role}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setEditing({ ...m }); setDialogOpen(true); }} className="flex items-center gap-1 px-3 py-1.5 border border-white/10 text-white/60 text-xs hover:border-primary hover:text-primary transition-all"><Edit className="w-3 h-3" /> Edit</button>
                <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(m.id); }} className="flex items-center gap-1 px-3 py-1.5 border border-white/10 text-red-400/60 text-xs hover:border-red-400 hover:text-red-400 transition-all"><Trash2 className="w-3 h-3" /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {members.length === 0 && <p className="py-16 text-center text-white/30 text-sm font-body">No team members yet</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-xl text-white">{editing?.id ? "Edit" : "New"} Team Member</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4 mt-4">
              <Input placeholder="Full Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input placeholder="Role / Title" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Textarea placeholder="Bio" value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Textarea placeholder="Specialties (one per line)" value={listToLines(editing.specialties)} onChange={(e) => setEditing({ ...editing, specialties: linesToList(e.target.value) })} className="bg-white/5 border-white/10 text-white" />
              <div>
                <Label className="text-white/60 text-sm mb-2 block">Photo</Label>
                {editing.photo && <img src={editing.photo} alt="" className="w-20 h-20 object-cover mb-2" />}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-white/50 text-sm" />
              </div>
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
