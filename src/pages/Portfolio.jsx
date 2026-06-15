import React from "react";
import { useQuery } from "@tanstack/react-query";
import { localApi } from "@/api/localClient";
import CinematicPortfolioExperience from "@/components/portfolio/CinematicPortfolioExperience";
import { useCms } from "@/lib/cms";

export default function Portfolio() {
  const cms = useCms();
  const hero = cms.pages.portfolio.hero;
  const { data: projects } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => localApi.entities.PortfolioProject.filter({ published: true }, "-created_date", 50),
    initialData: [],
  });

  return (
    <CinematicPortfolioExperience
      projects={projects}
      eyebrow={hero.subtitle}
      title={hero.title}
      intro={hero.description}
      showPortfolioLink={false}
      maxProjects={Number(hero.projectCount) || 7}
    />
  );
}
