import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import SmartBackButton from "@/components/shared/SmartBackButton";
import { useLegalDocument } from "@/lib/legalDocuments";
import { documentDownloadUrl } from "@/lib/media";

const splitContent = (value) =>
  String(value || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const upsertMeta = (selector, attributes) => {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value || ""));
};

export default function LegalPage({ page: pageProp }) {
  const { page } = useParams();
  const pageKey = pageProp || page || "privacy";
  const { document: legalDocument } = useLegalDocument(pageKey);
  const title = legalDocument?.title || "Legal Document";
  const content = legalDocument?.content || "";
  const paragraphs = splitContent(content);
  const updatedDate = formatDate(legalDocument?.updated_at || legalDocument?.created_at);
  const pdfUrl = legalDocument?.pdf_url || "";
  const downloadUrl = documentDownloadUrl(pdfUrl);

  useEffect(() => {
    if (!legalDocument) return;

    document.title = legalDocument.meta_title || legalDocument.title;
    upsertMeta('meta[name="description"]', {
      name: "description",
      content: legalDocument.meta_description || "",
    });
  }, [legalDocument]);

  return (
    <>
      <PageHero title={title} subtitle={legalDocument?.footer_label || "Legal"} />
      <section className="ashley-white-section legal-page-section py-16 md:py-24">
        <div className="legal-page-shell relative mx-auto px-6">
          <SmartBackButton fallback="/" className="mb-10 inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </SmartBackButton>

          <article className="legal-readable-document">
            <div className="legal-readable-head">
              <div>
                <p>Last updated</p>
                <span>{updatedDate || "Not published yet"}</span>
              </div>
              {pdfUrl && (
                <a href={downloadUrl || pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              )}
            </div>

            <div className="legal-document-content">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
              ) : (
                <p>This legal document has not been written yet.</p>
              )}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
