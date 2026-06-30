import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { localApi } from "@/api/localClient";
import { fallbackBlogPosts } from "@/data/fallbackContent";
import PageHero from "@/components/shared/PageHero";
import SmartBackButton from "@/components/shared/SmartBackButton";

const renderParagraphs = (content) =>
  String(content || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export default function BlogPost() {
  const { slug } = useParams();

  const { data: posts } = useQuery({
    queryKey: ["blog-post-detail"],
    queryFn: () => localApi.entities.BlogPost.filter({ published: true }, "-created_date", 100),
    initialData: [],
  });

  const allPosts = posts.length > 0 ? posts : fallbackBlogPosts;
  const post = allPosts.find((item) => item.slug === slug || item.id === slug);

  if (!post) {
    return (
      <>
        <PageHero title="Post Not Found" subtitle="Journal" />
        <section className="ashley-white-section py-20">
          <div className="relative mx-auto max-w-3xl px-6">
            <p className="text-white/60">The journal post you are looking for is not available.</p>
            <SmartBackButton fallback="/blog" className="ashley-button ashley-button-dark mt-8">
              <ArrowLeft className="h-4 w-4" />
              Back to Journal
            </SmartBackButton>
          </div>
        </section>
      </>
    );
  }

  const paragraphs = renderParagraphs(post.content || post.excerpt);

  return (
    <>
      <PageHero title={post.title} subtitle={post.category?.replace(/_/g, " ")} image={post.featured_image} height="min-h-[58svh]" />

      <article className="ashley-white-section py-16 md:py-24">
        <div className="relative mx-auto max-w-4xl px-6">
          <SmartBackButton fallback="/blog" className="mb-10 inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Journal
          </SmartBackButton>

          <div className="mb-10 flex flex-wrap gap-5 border-y border-white/10 py-5 text-xs uppercase tracking-[0.14em] text-white/60">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--ashley-accent)]" />
              {post.created_date ? format(new Date(post.created_date), "MMM d, yyyy") : "Undated"}
            </span>
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 text-[var(--ashley-accent)]" />
              {post.author || "Ikulungwane Studio"}
            </span>
          </div>

          <div className="space-y-7 text-lg leading-8 text-white/70">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </>
  );
}
