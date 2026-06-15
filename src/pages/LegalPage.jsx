import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import { legalPages } from "@/data/fallbackContent";

export default function LegalPage({ page: pageProp }) {
  const { page } = useParams();
  const content = legalPages[pageProp || page] || legalPages.privacy;

  return (
    <>
      <PageHero title={content.title} subtitle={content.subtitle} />
      <section className="ashley-white-section py-16 md:py-24">
        <div className="relative mx-auto max-w-3xl px-6">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm uppercase tracking-[0.12em] text-black/46 transition-colors hover:text-black">
            <ArrowLeft className="h-4 w-4" />
            Back Home
          </Link>
          <div className="space-y-6 border-l border-black/10 pl-6 text-base leading-8 text-black/60">
            {content.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
