import Hero from "./components/hero";
import Footer from "./components/footer";
import FeaturesSection from "./components/features-section";
import HowItWorksSection from "./components/how-it-works-section";
import SidebarLayout from "./components/sidebar-layout";

export default function Home() {
  return (
    <SidebarLayout>
      <div id="hero" className="min-h-screen flex flex-col items-center pt-24 p-8 animate-fade-in">
        <Hero />
      </div>
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="how-it-works">
        <HowItWorksSection />
      </div>
      <div id="contact">
        <Footer />
      </div>
    </SidebarLayout>
  );
}
