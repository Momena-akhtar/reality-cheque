'use client'
import { Server, ShieldCheck, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function FeaturesSection() {
  const [selected, setSelected] = useState(0)

  const features = [
    {
      title: 'Pre-built AI Agents',
      desc: 'Plug-and-play agents tailored for common workflows - sales, support, research and more.',
      icon: Server
    },
    {
      title: 'Secure by default',
      desc: 'Role-based access, data isolation and best-practice defaults so you can ship safely.',
      icon: ShieldCheck
    },
    {
      title: 'Fast integration',
      desc: 'Deploy models and flows in minutes with clear APIs and a friendly UI.',
      icon: Layers
    }
  ]

  const next = () => setSelected((selected + 1) % features.length)
  const prev = () => setSelected((selected - 1 + features.length) % features.length)

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24" id="features">
      <div className="text-center max-w-2xl mx-auto mb-20">
        <h2 className="text-4xl font-semibold text-foreground">Build chat assistants that fit your workflow</h2>
        <p className="text-primary-text-faded mt-4 text-sm">Create, customize and share chatbots for sales, support, marketing and more; no infra required.</p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon
            const isSelected = selected === i
            
            return (
              <div 
                key={f.title} 
                onClick={() => setSelected(i)}
                className={`relative cursor-pointer rounded-xl p-8 transition-all duration-300 ${
                  isSelected 
                    ? 'bg-primary border-primary text-background shadow-lg scale-105' 
                    : 'bg-card border border-border hover:border-muted-foreground/40 hover:shadow-sm'
                }`}
              >
                <div className="absolute inset-0 opacity-60 rounded-xl" />
                <div className="relative">
                  <Icon 
                    className={`w-6 h-6 mb-5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} 
                    strokeWidth={1.5} 
                  />
                  <h3 className={`text-lg font-medium mb-2 ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {f.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isSelected ? 'text-primary-foreground/80' : 'text-primary-text-faded'}`}>
                    {f.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={prev}
          className="absolute cursor-pointer left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 rounded-full bg-background border border-border hover:bg-accent transition-colors shadow-sm"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={next}
          className="absolute cursor-pointer right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 rounded-full bg-background border border-border hover:bg-accent transition-colors shadow-sm"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots indicator */}
        <div className="flex items-center justify-center mt-8 gap-2">
          {features.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === selected ? 'bg-primary w-6' : 'bg-border hover:bg-muted-foreground/40'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}