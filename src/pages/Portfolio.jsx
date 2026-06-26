import React from "react";
import { useQuery } from "@tanstack/react-query";
import { localApi } from "@/api/localClient";
import PortfolioCategoryGallery from "@/components/portfolio/PortfolioCategoryGallery";
import { useCms } from "@/lib/cms";

export default function Portfolio() {
  const cms = useCms();
  const hero = cms.pages.portfolio.hero;
  const { data: projects } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => localApi.entities.PortfolioProject.filter({ published: true }, "order", 50),
    initialData: [],
  });

  return (
    <PortfolioCategoryGallery
      projects={projects}
      eyebrow={hero.subtitle}
      title={hero.title}
      intro={hero.description}
      maxProjects={Number(hero.projectCount) || 7}
    />
  );
}
