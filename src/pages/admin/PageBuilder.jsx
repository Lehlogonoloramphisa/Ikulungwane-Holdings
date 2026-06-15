import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  Monitor,
  Plus,
  RotateCcw,
  Save,
  Smartphone,
  Trash2,
  Upload,
} from "lucide-react";
import { cmsDefaults } from "@/data/cmsDefaults";
import { deepMerge, getValueByPath, resetCmsContent, saveCmsContent, setValueByPath, useCmsOverride } from "@/lib/cms";
import { localApi } from "@/api/localClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const PAGES = [
  {
    key: "home",
    label: "Home",
    route: "/",
    sections: [
      {
        id: "hero",
        label: "Hero",
        path: "pages.home.hero",
        kind: "hero",
        imagePath: "pages.home.hero.backgroundImage",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
          { key: "paragraph", label: "Intro copy", role: "body" },
          { key: "primaryButtonText", label: "Primary button", role: "button" },
          { key: "secondaryButtonText", label: "Secondary button", role: "button" },
        ],
        list: { path: "pages.home.hero.statistics", titleKey: "value", textKey: "label", metaKey: "order", label: "Hero stats" },
      },
      {
        id: "portfolioPreview",
        label: "Our Work",
        path: "pages.home.portfolioPreview",
        kind: "gallery",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "backgroundTitle", label: "Background title", role: "ghost" },
          { key: "sectionTitle", label: "Headline", role: "title" },
          { key: "description", label: "Description", role: "body" },
        ],
      },
      {
        id: "aboutPreview",
        label: "About Preview",
        path: "pages.home.aboutPreview",
        kind: "split",
        imagePath: "pages.home.aboutPreview.mainImage",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
          { key: "mainParagraph", label: "Main copy", role: "body" },
          { key: "storyParagraph", label: "Story copy", role: "body" },
          { key: "primaryButtonText", label: "Primary button", role: "button" },
        ],
        list: { path: "pages.home.aboutPreview.featureCards", titleKey: "title", textKey: "description", metaKey: "icon", label: "Feature cards" },
      },
      {
        id: "process",
        label: "How We Work",
        path: "pages.home.process",
        kind: "list",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
          { key: "description", label: "Description", role: "body" },
          { key: "buttonText", label: "Button", role: "button" },
        ],
        list: { path: "pages.home.process.steps", titleKey: "title", textKey: "description", metaKey: "number", label: "Process steps" },
      },
      {
        id: "services",
        label: "What We Do",
        path: "pages.home.services",
        kind: "panel",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
          { key: "description", label: "Description", role: "body" },
        ],
      },
      {
        id: "whyChoose",
        label: "Why Choose Us",
        path: "pages.home.whyChoose",
        kind: "list",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
        ],
        list: { path: "pages.home.whyChoose.items", titleKey: "title", textKey: "description", metaKey: "icon", label: "Reasons" },
      },
      {
        id: "testimonials",
        label: "Testimonials",
        path: "pages.home.testimonials",
        kind: "panel",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
        ],
      },
      {
        id: "cta",
        label: "Closing CTA",
        path: "pages.home.cta",
        kind: "cta",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
          { key: "description", label: "Description", role: "body" },
          { key: "buttonText", label: "Button", role: "button" },
          { key: "whatsappButtonText", label: "WhatsApp button", role: "button" },
        ],
      },
    ],
  },
  {
    key: "portfolio",
    label: "Portfolio",
    route: "/portfolio",
    sections: [
      {
        id: "hero",
        label: "Portfolio Hero",
        path: "pages.portfolio.hero",
        kind: "hero",
        imagePath: "pages.portfolio.hero.backgroundImage",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
          { key: "description", label: "Description", role: "body" },
        ],
      },
    ],
  },
  {
    key: "services",
    label: "Services",
    route: "/services",
    sections: [
      {
        id: "hero",
        label: "Services Hero",
        path: "pages.services.hero",
        kind: "hero",
        imagePath: "pages.services.hero.backgroundImage",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
          { key: "description", label: "Description", role: "body" },
        ],
      },
      {
        id: "packages",
        label: "Packages",
        path: "pages.services",
        kind: "panel",
        fields: [
          { key: "packagesSubtitle", label: "Eyebrow", role: "kicker" },
          { key: "packagesTitle", label: "Headline", role: "title" },
        ],
      },
    ],
  },
  {
    key: "about",
    label: "About",
    route: "/about",
    sections: [
      {
        id: "hero",
        label: "About Hero",
        path: "pages.about.hero",
        kind: "split",
        imagePath: "pages.about.hero.mainImage",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
          { key: "description", label: "Description", role: "body" },
        ],
      },
      {
        id: "story",
        label: "Story",
        path: "pages.about",
        kind: "story",
        fields: [
          { key: "storySubtitle", label: "Eyebrow", role: "kicker" },
          { key: "storyTitle", label: "Headline", role: "title" },
          { key: "storyContent", label: "Story copy", role: "body" },
          { key: "storyContentTwo", label: "Second paragraph", role: "body" },
        ],
        list: { path: "pages.about.values", titleKey: "title", metaKey: "order", label: "Values" },
      },
      {
        id: "team",
        label: "Team Section",
        path: "pages.about",
        kind: "panel",
        fields: [
          { key: "teamSubtitle", label: "Eyebrow", role: "kicker" },
          { key: "teamTitle", label: "Headline", role: "title" },
        ],
        list: { path: "pages.about.stats", titleKey: "value", textKey: "label", metaKey: "order", label: "Stats" },
      },
    ],
  },
  {
    key: "journal",
    label: "Journal",
    route: "/blog",
    sections: [
      {
        id: "hero",
        label: "Journal Hero",
        path: "pages.journal.hero",
        kind: "hero",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
          { key: "description", label: "Description", role: "body" },
        ],
      },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    route: "/contact",
    sections: [
      {
        id: "hero",
        label: "Contact Hero",
        path: "pages.contact.hero",
        kind: "hero",
        imagePath: "pages.contact.hero.backgroundImage",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
          { key: "description", label: "Description", role: "body" },
        ],
      },
      {
        id: "contactPanel",
        label: "Contact Panel",
        path: "pages.contact",
        kind: "panel",
        fields: [
          { key: "responseLabel", label: "Signal label", role: "kicker" },
          { key: "responseValue", label: "Signal value", role: "title" },
          { key: "responseDescription", label: "Signal copy", role: "body" },
          { key: "panelTitle", label: "Panel headline", role: "title" },
          { key: "formSuccessTitle", label: "Success title", role: "button" },
        ],
      },
    ],
  },
  {
    key: "booking",
    label: "Book Now",
    route: "/booking",
    sections: [
      {
        id: "hero",
        label: "Booking Hero",
        path: "pages.booking.hero",
        kind: "hero",
        fields: [
          { key: "subtitle", label: "Eyebrow", role: "kicker" },
          { key: "title", label: "Headline", role: "title" },
          { key: "description", label: "Description", role: "body" },
        ],
      },
      {
        id: "bookingOptions",
        label: "Booking Options",
        path: "pages.booking",
        kind: "list",
        fields: [
          { key: "briefLabel", label: "Brief label", role: "kicker" },
          { key: "confirmationTitle", label: "Confirmation title", role: "title" },
          { key: "confirmationMessage", label: "Confirmation copy", role: "body" },
        ],
        list: { path: "pages.booking.services", titleKey: "label", textKey: "note", metaKey: "value", label: "Bookable services" },
      },
    ],
  },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const titleCase = (value) =>
  String(value)
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());

const updateByPath = (object, path, updater) => {
  const value = typeof updater === "function" ? updater(getValueByPath(object, path)) : updater;
  return setValueByPath(object, path, value);
};

const looksLikeMediaField = (key) =>
  /(image|video|logo|favicon|document|file|thumbnail|gallery|og)/i.test(key);

const emptyValueFor = (sample) => {
  if (typeof sample === "boolean") return true;
  if (typeof sample === "number") return 0;
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === "object") {
    return Object.fromEntries(Object.entries(sample).map(([key, value]) => [key, emptyValueFor(value)]));
  }
  return "";
};

function InlineEdit({ value, onChange, role = "body", placeholder }) {
  const Tag = role === "button" || role === "kicker" ? "input" : "textarea";
  const commonProps = {
    value: value || "",
    onChange: (event) => onChange(event.target.value),
    placeholder,
    className: `builder-inline-edit is-${role}`,
  };

  return Tag === "textarea" ? <textarea rows={role === "title" ? 2 : 3} {...commonProps} /> : <input {...commonProps} />;
}

function Field({ label, fieldKey, value, path, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await localApi.integrations.Core.UploadFile({ file });
      onChange(path, result.file_url || "");
    } finally {
      setUploading(false);
    }
  };

  if (typeof value === "boolean") {
    return (
      <div className="builder-toggle-field">
        <Label>{label}</Label>
        <Switch checked={value} onCheckedChange={(checked) => onChange(path, checked)} />
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="admin-field">
        <Label>{label}</Label>
        <Input type="number" value={value} onChange={(event) => onChange(path, Number(event.target.value))} />
      </div>
    );
  }

  const isLong = String(value || "").length > 90 || /(paragraph|description|content|message|story|summary)/i.test(fieldKey);

  return (
    <div className="admin-field">
      <div className="builder-field-label">
        <Label>{label}</Label>
        {looksLikeMediaField(fieldKey) && (
          <label>
            <Upload className="h-3 w-3" />
            {uploading ? "Uploading" : "Upload"}
            <input type="file" className="hidden" onChange={handleUpload} accept={/video/i.test(fieldKey) ? "video/*" : "image/*,video/*,.pdf"} />
          </label>
        )}
      </div>
      {isLong ? (
        <Textarea value={value || ""} onChange={(event) => onChange(path, event.target.value)} />
      ) : (
        <Input value={value || ""} onChange={(event) => onChange(path, event.target.value)} />
      )}
    </div>
  );
}

function ArrayEditor({ fieldKey, value, path, onChange }) {
  const sample = value?.[0] ?? "";
  const isPrimitive = !sample || typeof sample !== "object" || Array.isArray(sample);

  if (isPrimitive) {
    return (
      <div className="admin-field">
        <Label>{titleCase(fieldKey)}</Label>
        <Textarea
          value={(value || []).join("\n")}
          onChange={(event) => onChange(path, event.target.value.split("\n").filter(Boolean))}
          placeholder="One item per line"
        />
      </div>
    );
  }

  const mutate = (updater) => onChange(path, updater(value || []));

  return (
    <div className="builder-array-editor">
      <div className="builder-array-heading">
        <Label>{titleCase(fieldKey)}</Label>
        <button type="button" onClick={() => mutate((items) => [...items, emptyValueFor(sample)])}>
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {(value || []).map((item, index) => (
        <details key={index} className="builder-details" open={index < 2}>
          <summary>
            <span>{item.title || item.label || item.name || item.value || `${titleCase(fieldKey)} ${index + 1}`}</span>
            <div>
              <button type="button" onClick={(event) => { event.preventDefault(); mutate((items) => items.flatMap((entry, i) => (i === index ? [entry, clone(entry)] : [entry]))); }}>
                <Copy className="h-4 w-4" />
              </button>
              <button type="button" disabled={index === 0} onClick={(event) => { event.preventDefault(); mutate((items) => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next.map((entry, i) => ({ ...entry, order: i + 1 })); }); }}>
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" disabled={index === value.length - 1} onClick={(event) => { event.preventDefault(); mutate((items) => { const next = [...items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next.map((entry, i) => ({ ...entry, order: i + 1 })); }); }}>
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={(event) => { event.preventDefault(); mutate((items) => items.filter((_, i) => i !== index)); }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </summary>
          <div className="builder-object-grid">
            <ObjectEditor value={item} path={`${path}.${index}`} onChange={onChange} />
          </div>
        </details>
      ))}
    </div>
  );
}

function ObjectEditor({ value, path, onChange }) {
  return Object.entries(value || {}).map(([key, itemValue]) => {
    const childPath = `${path}.${key}`;

    if (Array.isArray(itemValue)) {
      return (
        <div key={childPath} className="builder-wide-field">
          <ArrayEditor fieldKey={key} value={itemValue} path={childPath} onChange={onChange} />
        </div>
      );
    }

    if (itemValue && typeof itemValue === "object") {
      return (
        <details key={childPath} className="builder-details builder-wide-field" open>
          <summary><span>{titleCase(key)}</span></summary>
          <div className="builder-object-grid">
            <ObjectEditor value={itemValue} path={childPath} onChange={onChange} />
          </div>
        </details>
      );
    }

    return (
      <Field
        key={childPath}
        label={titleCase(key)}
        fieldKey={key}
        value={itemValue}
        path={childPath}
        onChange={onChange}
      />
    );
  });
}

function ImagePreview({ src, label }) {
  return (
    <div className="builder-image-preview">
      {src ? <img src={src} alt="" /> : <div><Upload className="h-5 w-5" /> Add {label}</div>}
    </div>
  );
}

function HeroSlideControls({ slides = [], activeSlideIndex, onSelect, compact = false }) {
  if (!Array.isArray(slides) || slides.length === 0) return null;

  return (
    <div className={`builder-slide-rail ${compact ? "is-compact" : ""}`} onClick={(event) => event.stopPropagation()}>
      {slides.map((slide, index) => (
        <button
          key={`${slide.label || "slide"}-${index}`}
          type="button"
          onClick={() => onSelect(index)}
          className={activeSlideIndex === index ? "is-active" : ""}
        >
          <span>Slide {index + 1}</span>
          <strong>{slide.label || `Slide ${index + 1}`}</strong>
          {slide.enabled === false && <em>Hidden</em>}
        </button>
      ))}
    </div>
  );
}

function EditableFieldSet({ config, value, sectionPath, onChange }) {
  return (
    <>
      {config.fields.map((field) => (
        <InlineEdit
          key={field.key}
          role={field.role}
          value={value?.[field.key]}
          placeholder={field.label}
          onChange={(nextValue) => onChange(`${sectionPath}.${field.key}`, nextValue)}
        />
      ))}
    </>
  );
}

function ListPreview({ list, content, onChange }) {
  if (!list) return null;
  const items = getValueByPath(content, list.path) || [];
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="builder-preview-list">
      <p>{list.label}</p>
      <div>
        {items.slice(0, 4).map((item, index) => {
          const isPrimitive = !item || typeof item !== "object";
          return (
            <article key={index}>
              {!isPrimitive && list.metaKey && <span>{item[list.metaKey]}</span>}
              <InlineEdit
                role="button"
                value={isPrimitive ? item : item[list.titleKey]}
                onChange={(nextValue) => onChange(`${list.path}.${index}${isPrimitive ? "" : `.${list.titleKey}`}`, nextValue)}
                placeholder="Item title"
              />
              {!isPrimitive && list.textKey && (
                <InlineEdit
                  role="body"
                  value={item[list.textKey]}
                  onChange={(nextValue) => onChange(`${list.path}.${index}.${list.textKey}`, nextValue)}
                  placeholder="Item description"
                />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SectionPreview({ config, content, isActive, onSelect, onChange, activeSlideIndex, onSlideSelect }) {
  const value = getValueByPath(content, config.path) || {};
  const image = config.imagePath ? getValueByPath(content, config.imagePath) : "";
  const slides = Array.isArray(value.slides) ? value.slides : [];
  const activeSlide = slides[activeSlideIndex] || slides[0];
  const heroImage = config.kind === "hero" && activeSlide?.image ? activeSlide.image : image;
  const isHidden = value.show === false;

  return (
    <section
      className={`builder-preview-section is-${config.kind} ${isActive ? "is-active" : ""} ${isHidden ? "is-hidden-section" : ""}`}
      onClick={onSelect}
    >
      <div className="builder-section-badge">
        {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {config.label}
      </div>

      {config.kind === "split" && <ImagePreview src={image} label="image" />}
      {config.kind === "hero" && (
        <div className="builder-hero-art" style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}>
          {!heroImage && <Upload className="h-6 w-6" />}
          {slides.length > 0 && (
            <>
              <div className="builder-slide-status">
                <span>Editing slide {activeSlideIndex + 1} of {slides.length}</span>
                <strong>{activeSlide?.label || `Slide ${activeSlideIndex + 1}`}</strong>
              </div>
              <HeroSlideControls
                slides={slides}
                activeSlideIndex={activeSlideIndex}
                onSelect={onSlideSelect}
                compact
              />
            </>
          )}
        </div>
      )}

      <div className="builder-preview-copy">
        <EditableFieldSet config={config} value={value} sectionPath={config.path} onChange={onChange} />
      </div>

      <ListPreview list={config.list} content={content} onChange={onChange} />
    </section>
  );
}

function Inspector({ section, content, onChange, activeSlideIndex, onSlideSelect }) {
  const value = getValueByPath(content, section.path) || {};
  const slides = Array.isArray(value.slides) ? value.slides : [];
  const activeSlide = slides[activeSlideIndex] || slides[0];
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !section.imagePath) return;
    setUploading(true);
    try {
      const result = await localApi.integrations.Core.UploadFile({ file });
      onChange(section.imagePath, result.file_url || "");
    } finally {
      setUploading(false);
    }
  };

  const updateSlides = (nextSlides, nextIndex = activeSlideIndex) => {
    onChange(`${section.path}.slides`, nextSlides);
    onSlideSelect(Math.max(0, Math.min(nextIndex, nextSlides.length - 1)));
  };

  const addSlide = () => {
    const nextSlide = {
      label: `Slide ${slides.length + 1}`,
      image: value.backgroundImage || activeSlide?.image || "",
      video: "",
      enabled: true,
      order: slides.length + 1,
    };
    updateSlides([...slides, nextSlide], slides.length);
  };

  const duplicateSlide = () => {
    if (!activeSlide) return;
    const nextSlide = {
      ...clone(activeSlide),
      label: `${activeSlide.label || `Slide ${activeSlideIndex + 1}`} Copy`,
      order: slides.length + 1,
    };
    updateSlides([...slides, nextSlide], slides.length);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    const nextSlides = slides
      .filter((_, index) => index !== activeSlideIndex)
      .map((slide, index) => ({ ...slide, order: index + 1 }));
    updateSlides(nextSlides, Math.max(0, activeSlideIndex - 1));
  };

  const moveSlide = (direction) => {
    const nextIndex = activeSlideIndex + direction;
    if (nextIndex < 0 || nextIndex >= slides.length) return;
    const nextSlides = [...slides];
    [nextSlides[activeSlideIndex], nextSlides[nextIndex]] = [nextSlides[nextIndex], nextSlides[activeSlideIndex]];
    updateSlides(nextSlides.map((slide, index) => ({ ...slide, order: index + 1 })), nextIndex);
  };

  return (
    <aside className="builder-inspector">
      <div className="builder-inspector-head">
        <div>
          <p className="admin-eyebrow">Inspector</p>
          <h2>{section.label}</h2>
        </div>
        {typeof value.show === "boolean" && (
          <Switch checked={value.show} onCheckedChange={(checked) => onChange(`${section.path}.show`, checked)} />
        )}
      </div>

      {slides.length > 0 && (
        <div className="builder-inspector-panel">
          <div className="builder-slide-panel-head">
            <div>
              <h3>Hero Slides</h3>
              <p>Currently editing slide {activeSlideIndex + 1} of {slides.length}</p>
            </div>
            <button type="button" onClick={addSlide}>
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          <HeroSlideControls
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            onSelect={onSlideSelect}
          />

          {activeSlide && (
            <div className="builder-active-slide-card">
              <div className="builder-active-slide-title">
                <span>Slide {activeSlideIndex + 1} of {slides.length}</span>
                <strong>{activeSlide.label || `Slide ${activeSlideIndex + 1}`}</strong>
              </div>
              <div className="builder-slide-actions">
                <button type="button" onClick={() => moveSlide(-1)} disabled={activeSlideIndex === 0} aria-label="Move slide up">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => moveSlide(1)} disabled={activeSlideIndex === slides.length - 1} aria-label="Move slide down">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={duplicateSlide} aria-label="Duplicate slide">
                  <Copy className="h-4 w-4" />
                </button>
                <button type="button" onClick={deleteSlide} disabled={slides.length <= 1} aria-label="Delete slide">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="builder-inspector-fields">
                <Field label="Slide label" fieldKey="label" value={activeSlide.label} path={`${section.path}.slides.${activeSlideIndex}.label`} onChange={onChange} />
                <Field label="Slide image" fieldKey="image" value={activeSlide.image} path={`${section.path}.slides.${activeSlideIndex}.image`} onChange={onChange} />
                <Field label="Slide video" fieldKey="video" value={activeSlide.video} path={`${section.path}.slides.${activeSlideIndex}.video`} onChange={onChange} />
                <Field label="Slide order" fieldKey="order" value={activeSlide.order || activeSlideIndex + 1} path={`${section.path}.slides.${activeSlideIndex}.order`} onChange={onChange} />
                <Field label="Slide enabled" fieldKey="enabled" value={activeSlide.enabled !== false} path={`${section.path}.slides.${activeSlideIndex}.enabled`} onChange={onChange} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="builder-inspector-panel">
        <h3>Quick edit</h3>
        <div className="builder-inspector-fields">
          {section.fields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              fieldKey={field.key}
              value={value[field.key]}
              path={`${section.path}.${field.key}`}
              onChange={onChange}
            />
          ))}
        </div>
      </div>

      {section.imagePath && (
        <div className="builder-inspector-panel">
          <h3>Media</h3>
          <ImagePreview src={getValueByPath(content, section.imagePath)} label="image" />
          <Field
            label="Image URL"
            fieldKey="image"
            value={getValueByPath(content, section.imagePath)}
            path={section.imagePath}
            onChange={onChange}
          />
          <label className="builder-upload-button">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading" : "Upload Image"}
            <input type="file" className="hidden" accept="image/*,video/*" onChange={uploadImage} />
          </label>
        </div>
      )}

      <details className="builder-inspector-panel" open>
        <summary>Advanced section data</summary>
        <div className="builder-object-grid">
          <ObjectEditor value={value} path={section.path} onChange={onChange} />
        </div>
      </details>
    </aside>
  );
}

export default function PageBuilder() {
  const override = useCmsOverride();
  const [activePageKey, setActivePageKey] = useState("home");
  const [selectedSectionId, setSelectedSectionId] = useState("hero");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [device, setDevice] = useState("desktop");
  const [saved, setSaved] = useState(false);
  const [content, setContent] = useState(() => deepMerge(cmsDefaults, override));

  useEffect(() => {
    setContent(deepMerge(cmsDefaults, override));
  }, [override]);

  const activePage = useMemo(
    () => PAGES.find((page) => page.key === activePageKey) || PAGES[0],
    [activePageKey]
  );

  const selectedSection = useMemo(
    () => activePage.sections.find((section) => section.id === selectedSectionId) || activePage.sections[0],
    [activePage, selectedSectionId]
  );

  const selectedValue = getValueByPath(content, selectedSection.path) || {};
  const selectedSlides = Array.isArray(selectedValue.slides) ? selectedValue.slides : [];

  useEffect(() => {
    if (selectedSlides.length === 0) {
      if (activeSlideIndex !== 0) setActiveSlideIndex(0);
      return;
    }

    if (activeSlideIndex > selectedSlides.length - 1) {
      setActiveSlideIndex(selectedSlides.length - 1);
    }
  }, [activeSlideIndex, selectedSlides.length]);

  const handlePageChange = (pageKey) => {
    const nextPage = PAGES.find((page) => page.key === pageKey) || PAGES[0];
    setActivePageKey(pageKey);
    setSelectedSectionId(nextPage.sections[0].id);
    setActiveSlideIndex(0);
  };

  const handleChange = (path, value) => {
    setContent((current) => updateByPath(current, path, value));
  };

  const handleSave = () => {
    saveCmsContent(content);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleReset = () => {
    if (!window.confirm("Reset all CMS content to the default Ikulungwane structure?")) return;
    resetCmsContent();
    setContent(clone(cmsDefaults));
    setSelectedSectionId(activePage.sections[0].id);
    setActiveSlideIndex(0);
  };

  return (
    <div className="visual-builder">
      <section className="visual-builder-hero">
        <div>
          <p className="admin-eyebrow">Visual CMS</p>
          <h1>Page Builder</h1>
          <span>Edit directly on a live-style preview, then fine tune the selected section in the inspector.</span>
        </div>
        <div className="visual-builder-actions">
          <Link to={activePage.route} className="admin-ghost-cta">
            View Live
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button type="button" onClick={handleReset} className="admin-ghost-cta">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button type="button" onClick={handleSave} className="admin-hero-cta">
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </section>

      <div className="builder-page-tabs">
        {PAGES.map((page) => (
          <button
            key={page.key}
            type="button"
            onClick={() => handlePageChange(page.key)}
            className={activePage.key === page.key ? "is-active" : ""}
          >
            {page.label}
          </button>
        ))}
      </div>

      <div className="builder-workspace">
        <aside className="builder-section-rail">
          <div className="builder-rail-heading">
            <Layers className="h-4 w-4" />
            <span>{activePage.label} sections</span>
          </div>
          {activePage.sections.map((section) => {
            const value = getValueByPath(content, section.path) || {};
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setSelectedSectionId(section.id);
                  if (section.id !== selectedSection.id) setActiveSlideIndex(0);
                }}
                className={selectedSection.id === section.id ? "is-active" : ""}
              >
                <span>{section.label}</span>
                {value.show === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            );
          })}
        </aside>

        <main className="builder-stage">
          <div className="builder-stage-toolbar">
            <div>
              <span>{activePage.route}</span>
              <strong>{activePage.label} Preview</strong>
            </div>
            <div className="builder-device-toggle">
              <button type="button" onClick={() => setDevice("desktop")} className={device === "desktop" ? "is-active" : ""} aria-label="Desktop preview">
                <Monitor className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setDevice("mobile")} className={device === "mobile" ? "is-active" : ""} aria-label="Mobile preview">
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={`builder-preview-frame is-${device}`}>
            <div className="builder-browser-bar">
              <i />
              <i />
              <i />
              <span>{activePage.route}</span>
            </div>
            <div className="builder-preview-surface">
              {activePage.sections.map((section) => (
                <SectionPreview
                  key={section.id}
                  config={section}
                  content={content}
                  isActive={selectedSection.id === section.id}
                  activeSlideIndex={selectedSection.id === section.id ? activeSlideIndex : 0}
                  onSelect={() => {
                    setSelectedSectionId(section.id);
                    if (section.id !== selectedSection.id) setActiveSlideIndex(0);
                  }}
                  onSlideSelect={setActiveSlideIndex}
                  onChange={handleChange}
                />
              ))}
            </div>
          </div>
        </main>

        <Inspector
          section={selectedSection}
          content={content}
          onChange={handleChange}
          activeSlideIndex={activeSlideIndex}
          onSlideSelect={setActiveSlideIndex}
        />
      </div>
    </div>
  );
}
