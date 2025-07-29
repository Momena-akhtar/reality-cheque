import Hero from "./components/hero";
import Footer from "./components/footer";
import BotGrid from "./components/bot-grid";
import SidebarLayout from "./components/sidebar-layout";

export default function Home() {
  return (
    <SidebarLayout>
      <div className="min-h-screen flex flex-col items-center pt-24 p-8 animate-fade-in">
        <Hero />
      </div>
      <BotGrid />
      <Footer />
    </SidebarLayout>
  );
}
