import Image from "next/image";
import Navigation from "./components/navigation";
import Hero from "./components/hero";

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen flex flex-col items-center pt-24 p-8 animate-fade-in">
        <Hero />
      </main>
    </>
  );
}
