import React, { useState } from "react";
import { Image as ImageIcon, Link2, Trash2, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { localApi } from "@/api/localClient";
import { normalizeMediaUrl } from "@/lib/media";

export default function AdminMediaField({
  label,
  value,
  onChange,
  recommendedSize,
  help,
  accept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon",
}) {
  const inputId = React.useId();
  const previewUrl = normalizeMediaUrl(value);
  const [externalUrl, setExternalUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await localApi.integrations.Core.UploadFile({ file });
      onChange(result.file_url || "");
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleUseUrl = () => {
    const url = normalizeMediaUrl(externalUrl);
    if (!url) return;
    onChange(url);
    setExternalUrl("");
    setError("");
  };

  return (
    <div className="admin-media-field">
      <div className="admin-media-head">
        <div>
          <Label htmlFor={inputId}>{label}</Label>
          {recommendedSize && <p>Recommended: <strong>{recommendedSize}</strong></p>}
          {help && <span>{help}</span>}
        </div>
        <ImageIcon className="h-5 w-5" />
      </div>

      <div className="admin-media-preview">
        {previewUrl ? (
          <img src={previewUrl} alt={`${label} preview`} />
        ) : (
          <div>
            <ImageIcon className="h-6 w-6" />
            <span>No image selected</span>
          </div>
        )}
      </div>

      <div className="admin-media-actions">
        <label htmlFor={inputId}>
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : value ? "Replace image" : "Upload image"}
        </label>
        {value && (
          <button type="button" onClick={() => onChange("")}>
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        accept={accept}
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="admin-media-url-row">
        <Input
          value={externalUrl}
          onChange={(event) => setExternalUrl(event.target.value)}
          placeholder="Paste image URL or Google Drive share link"
        />
        <button type="button" onClick={handleUseUrl}>
          <Link2 className="h-4 w-4" />
          Use Link
        </button>
      </div>

      <p className="admin-media-note">
        For Google Drive, set sharing to anyone with the link so the image can display publicly.
      </p>
      {error && <p className="admin-media-error">{error}</p>}
    </div>
  );
}
