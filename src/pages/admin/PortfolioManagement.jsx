import React, { useState } from "react";
import { ArrowDown, ArrowUp, Check, Image, Images, Link2, Plus, Star, Trash2, Upload, Edit } from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminMediaField from "@/components/admin/AdminMediaField";
import { slugify } from "@/lib/adminHelpers";
import { normalizeMediaUrl } from "@/lib/media";

const CATEGORIES = ["weddings", "events", "corporate", "graduations", "product", "lifestyle", "videography"];

const emptyProject = {
  title: "", slug: "", category: "weddings", cover_image: "", description: "",
  images: [], video_url: "", client_name: "", client_testimonial: "",
  location: "", date: "", featured: false, published: true, metadata: "",
  order: 0, gallery_images: [],
};

const galleryUrl = (image) => normalizeMediaUrl(typeof image === "string" ? image : image?.image_url);

const renumberGallery = (images = []) =>
  images.map((image, index) => ({ ...image, sort_order: index + 1 }));

const normalizeGalleryImages = (project = {}) => {
  const coverUrl = normalizeMediaUrl(project.cover_image);
  const source = Array.isArray(project.gallery_images) && project.gallery_images.length > 0
    ? project.gallery_images
    : (Array.isArray(project.images) ? project.images : []);

  return renumberGallery(
    source
      .map((image, index) => {
        const image_url = galleryUrl(image);
        if (!image_url || image_url === coverUrl) return null;
        return {
          id: typeof image === "object" && image?.id ? image.id : `gallery-${Date.now()}-${index}`,
          project_id: project.id || "",
          image_url,
          caption: typeof image === "object" ? image.caption || image.alt_text || "" : "",
          sort_order: Number(image?.sort_order ?? image?.display_order ?? index + 1),
        };
      })
      .filter(Boolean)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
  );
};

const galleryPayload = (project) => {
  const gallery_images = renumberGallery(project.gallery_images || []);
  return {
    ...project,
    gallery_images,
    images: gallery_images.map((image) => image.image_url),
  };
};

export default function PortfolioManagement() {
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageEditing, setImageEditing] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryLink, setGalleryLink] = useState("");
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["admin-portfolio"],
    queryFn: () => localApi.entities.PortfolioProject.list("order", 100),
    initialData: [],
  });

  const invalidatePortfolio = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    queryClient.invalidateQueries({ queryKey: ["featured-projects"] });
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = galleryPayload({ ...data, slug: data.slug || slugify(data.title) });
      if (payload.id) return localApi.entities.PortfolioProject.update(payload.id, payload);
      return localApi.entities.PortfolioProject.create(payload);
    },
    onSuccess: () => { invalidatePortfolio(); setDialogOpen(false); setEditing(null); },
  });

  const saveImagesMutation = useMutation({
    mutationFn: (data) => localApi.entities.PortfolioProject.update(data.id, galleryPayload(data)),
    onSuccess: () => { invalidatePortfolio(); setImageDialogOpen(false); setImageEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.PortfolioProject.delete(id),
    onSuccess: invalidatePortfolio,
  });

  const handleNew = () => { setEditing({ ...emptyProject }); setDialogOpen(true); };
  const handleEdit = (project) => { setEditing({ ...project, gallery_images: normalizeGalleryImages(project) }); setDialogOpen(true); };
  const handleManageImages = (project) => {
    setImageEditing({ ...project, gallery_images: normalizeGalleryImages(project) });
    setGalleryLink("");
    setImageDialogOpen(true);
  };

  const updateGalleryImage = (index, patch) => {
    setImageEditing((current) => ({
      ...current,
      gallery_images: renumberGallery((current.gallery_images || []).map((image, imageIndex) => (
        imageIndex === index ? { ...image, ...patch } : image
      ))),
    }));
  };

  const moveGalleryImage = (index, direction) => {
    setImageEditing((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= (current.gallery_images || []).length) return current;
      const nextImages = [...(current.gallery_images || [])];
      [nextImages[index], nextImages[nextIndex]] = [nextImages[nextIndex], nextImages[index]];
      return { ...current, gallery_images: renumberGallery(nextImages) };
    });
  };

  const removeGalleryImage = (index) => {
    setImageEditing((current) => ({
      ...current,
      gallery_images: renumberGallery((current.gallery_images || []).filter((_, imageIndex) => imageIndex !== index)),
    }));
  };

  const handleGalleryUpload = async (files) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;

    setUploadingGallery(true);
    try {
      const uploaded = [];
      for (const file of selected) {
        const result = await localApi.integrations.Core.UploadFile({ file });
        if (result.file_url) {
          uploaded.push({
            id: `gallery-${Date.now()}-${uploaded.length}`,
            project_id: imageEditing?.id || "",
            image_url: result.file_url,
            caption: "",
            sort_order: (imageEditing?.gallery_images?.length || 0) + uploaded.length + 1,
          });
        }
      }
      setImageEditing((current) => ({
        ...current,
        gallery_images: renumberGallery([...(current.gallery_images || []), ...uploaded]),
      }));
    } catch (error) {
      window.alert(error.message || "Could not upload the selected images.");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleGalleryLinkAdd = () => {
    const imageUrl = normalizeMediaUrl(galleryLink);
    if (!imageUrl) {
      window.alert("Paste a public image URL or Google Drive share link first.");
      return;
    }

    setImageEditing((current) => ({
      ...current,
      gallery_images: renumberGallery([
        ...(current.gallery_images || []),
        {
          id: `gallery-link-${Date.now()}`,
          project_id: current?.id || "",
          image_url: imageUrl,
          caption: "",
          sort_order: (current?.gallery_images?.length || 0) + 1,
        },
      ]),
    }));
    setGalleryLink("");
  };

  return (
    <div className="admin-list-page">
      <AdminPageHeader
        eyebrow="Content"
        title="Portfolio"
        description="Manage the work shown across the portfolio and home selected work sections."
        count={`${projects.length} categories`}
        actions={(
          <button onClick={handleNew} className="admin-primary-action">
          <Plus className="w-4 h-4" /> Add Portfolio Category
          </button>
        )}
      />

      <div className="admin-collection-grid">
        {projects.map((project) => (
          <article key={project.id} className="admin-content-card">
            <div className="aspect-video relative">
              {normalizeMediaUrl(project.cover_image) ? (
                <img src={normalizeMediaUrl(project.cover_image)} alt={project.title} className="w-full h-full object-contain bg-black/35" />
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
              <p className="text-primary text-[10px] uppercase tracking-wider font-body">
                {String(project.order || 0).padStart(2, "0")} / {project.category}
              </p>
              <h3 className="text-white font-body font-medium mt-1">{project.title}</h3>
              <p className="mt-2 text-xs text-white/40">{normalizeGalleryImages(project).length} gallery images</p>
              <div className="admin-record-actions">
                <button onClick={() => handleEdit(project)}>
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleManageImages(project)}>
                  <Images className="w-3 h-3" /> Manage Images
                </button>
                <button onClick={() => { if (confirm("Delete this project?")) deleteMutation.mutate(project.id); }} className="is-danger">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {projects.length === 0 && <p className="admin-empty-copy">No portfolio projects yet</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-white">
              {editing?.id ? "Edit Portfolio Category" : "New Portfolio Category"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="admin-dialog-form">
              <Input placeholder="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input placeholder="URL Slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#222] border-white/10 text-white">
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Order Number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white" />
              <Textarea placeholder="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="bg-white/5 border-white/10 text-white min-h-[100px]" />
              
              <AdminMediaField
                label="Cover Image"
                value={editing.cover_image}
                recommendedSize="1600 x 1000 px or larger"
                help="The main image shown on the portfolio category card. Gallery images are managed separately."
                onChange={(fileUrl) => setEditing({ ...editing, cover_image: fileUrl })}
              />

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

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-white">
              Manage Images{imageEditing?.title ? `: ${imageEditing.title}` : ""}
            </DialogTitle>
          </DialogHeader>

          {imageEditing && (
            <div className="portfolio-image-manager">
              <AdminMediaField
                label="Cover Image"
                value={imageEditing.cover_image}
                recommendedSize="1600 x 1000 px or larger"
                help="This is the main image used on the portfolio category card and shown first in the public gallery."
                onChange={(fileUrl) => setImageEditing({ ...imageEditing, cover_image: fileUrl })}
              />

              <div className="portfolio-gallery-toolbar">
                <div>
                  <p className="admin-eyebrow">Gallery Images</p>
                  <h3>{(imageEditing.gallery_images || []).length} images under this category</h3>
                </div>
                <div className="portfolio-gallery-toolbar-actions">
                  <label>
                    <Upload className="h-4 w-4" />
                    {uploadingGallery ? "Uploading..." : "Upload More Images"}
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      onChange={(event) => {
                        handleGalleryUpload(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <div className="portfolio-gallery-link-row">
                    <Input
                      value={galleryLink}
                      onChange={(event) => setGalleryLink(event.target.value)}
                      placeholder="Paste image or Google Drive link"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleGalleryLinkAdd();
                        }
                      }}
                    />
                    <button type="button" onClick={handleGalleryLinkAdd}>
                      <Link2 className="h-4 w-4" />
                      Add Link
                    </button>
                  </div>
                </div>
              </div>

              <div className="portfolio-gallery-list">
                {(imageEditing.gallery_images || []).map((imageItem, index) => (
                  <article key={imageItem.id || imageItem.image_url} className="portfolio-gallery-editor-card">
                    <div className="portfolio-gallery-thumb">
                      {normalizeMediaUrl(imageItem.image_url) ? (
                        <img src={normalizeMediaUrl(imageItem.image_url)} alt={imageItem.caption || imageEditing.title} />
                      ) : (
                        <Image className="h-6 w-6 text-white/30" />
                      )}
                    </div>
                    <div className="portfolio-gallery-fields">
                      <Input
                        value={imageItem.image_url}
                        onChange={(event) => updateGalleryImage(index, { image_url: normalizeMediaUrl(event.target.value) })}
                        placeholder="Image URL or Google Drive link"
                      />
                      <Input
                        value={imageItem.caption || ""}
                        onChange={(event) => updateGalleryImage(index, { caption: event.target.value })}
                        placeholder="Caption"
                      />
                    </div>
                    <div className="portfolio-gallery-actions">
                      <button type="button" onClick={() => moveGalleryImage(index, -1)} disabled={index === 0} aria-label="Move image up">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => moveGalleryImage(index, 1)} disabled={index === imageEditing.gallery_images.length - 1} aria-label="Move image down">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setImageEditing({ ...imageEditing, cover_image: imageItem.image_url })}>
                        <Check className="h-4 w-4" />
                        Set Cover
                      </button>
                      <button type="button" className="is-danger" onClick={() => removeGalleryImage(index)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
                {(imageEditing.gallery_images || []).length === 0 && (
                  <p className="admin-empty-copy">No extra images yet. Upload images to build this category gallery.</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => saveImagesMutation.mutate(imageEditing)}
                disabled={saveImagesMutation.isPending || uploadingGallery}
                className="admin-primary-action w-full"
              >
                {saveImagesMutation.isPending ? "Saving..." : "Save Gallery Order"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
