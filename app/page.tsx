import Image from "next/image";
import Navigation from "./components/navigation";

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen flex flex-col items-center pt-24 p-8 animate-fade-in">
        <div className="max-w-4xl w-full space-y-12 text-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              Welcome to MiniBots
            </h1>
            <p className="text-xl text-foreground/80">
              Your hub for domain-specific AI assistants, making knowledge access smarter and more efficient.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
              Get Started
            </button>
            <button className="px-6 py-3 border border-border rounded-lg hover:bg-card-hover transition-colors">
              Learn More
            </button>
          </div>

          <div className="relative w-full h-64 rounded-xl overflow-hidden">
            <Image
              src="/placeholder-dashboard.png"
              alt="MiniBots Dashboard Preview"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Specialized Agents",
                description: "Access domain-specific AI assistants trained for your needs"
              },
              {
                title: "Smart Interactions",
                description: "Natural conversations with context-aware responses"
              },
              {
                title: "Seamless Integration",
                description: "Easy to use interface that works with your workflow"
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-lg bg-card hover:bg-card-hover transition-colors">
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-foreground/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
