"use client"
import Hero from "./components/hero";
import Footer from "./components/footer";
import FeaturesSection from "./components/features-section";
import HowItWorksSection from "./components/how-it-works-section";
import SidebarLayout from "./components/sidebar-layout";
import { useAuth } from "./context/AuthContext";
import BotGrid from "./components/bot-grid";

export default function Home() {
  const { user } = useAuth();
  return (
    <SidebarLayout>
      <div id="hero" className="min-h-screen flex flex-col items-center pt-24 p-8 animate-fade-in">
        <Hero />
      </div>
      {!user ? (
        <>
          <div id="features">
            <FeaturesSection />
          </div>
          <div id="how-it-works">
            <HowItWorksSection />
          </div>
        </>
      ) : (
        <div id="explore">
          <BotGrid />
        </div>
      )}
      <div id="contact">
        <Footer />
      </div>
    </SidebarLayout>
  );
}
