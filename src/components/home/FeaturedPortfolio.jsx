import React from "react";
import { useQuery } from "@tanstack/react-query";
import { localApi } from "@/api/localClient";
import CinematicPortfolioExperience from "@/components/portfolio/CinematicPortfolioExperience";
import { useCms } from "@/lib/cms";

export default function FeaturedPortfolio() {
  const cms = useCms();
  const section = cms.pages.home.portfolioPreview;
  const { data: projects } = useQuery({
    queryKey: ["featured-projects"],
    queryFn: () => localApi.entities.PortfolioProject.filter({ featured: true, published: true }, "-order", 8),
    initialData: [],
  });

  if (!section.show) return null;

  return (
    <CinematicPortfolioExperience
      projects={projects}
      eyebrow={section.subtitle}
      title={section.sectionTitle}
      backgroundTitle={section.backgroundTitle}
      intro={section.description}
      showPortfolioLink
      showTransition={false}
      showStickyShowcase={false}
      horizontalProjectLink="/portfolio"
      maxProjects={Number(section.featuredProjectCount) || 5}
    />
  );
}
