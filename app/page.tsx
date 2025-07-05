import Navigation from "./components/navigation";
import Hero from "./components/hero";
import SortBar from "./components/sort-bar";
import Footer from "./components/footer";
export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen flex flex-col items-center pt-24 p-8 animate-fade-in">
        <Hero />
      </main>
      <div className="w-full max-w-7xl mx-auto px-4">
        <SortBar />
      </div>
      <Footer />
    </>
  );
}
