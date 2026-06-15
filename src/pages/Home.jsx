import React from "react";
import HeroSection from "../components/home/HeroSection";
import FeaturedPortfolio from "../components/home/FeaturedPortfolio";
import AboutPreview from "../components/home/AboutPreview";
import ServicesPreview from "../components/home/ServicesPreview";
import ProcessSection from "../components/home/ProcessSection";
import WhyChooseUs from "../components/home/WhyChooseUs";
import TestimonialsSection from "../components/home/TestimonialsSection";
import ContactCTA from "../components/home/ContactCTA";
import StudioSectionsMotion from "../components/home/StudioSectionsMotion";

export default function Home() {
  return (
    <div className="home-studio-flow">
      <StudioSectionsMotion />
      <HeroSection />
      <FeaturedPortfolio />
      <AboutPreview />
      <ProcessSection />
      <ServicesPreview />
      <WhyChooseUs />
      <TestimonialsSection />
      <ContactCTA />
    </div>
  );
}
