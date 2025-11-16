'use client'
import { Server, ShieldCheck, Users, Layers } from 'lucide-react'

export default function FeaturesSection() {
  const features = [
    {
      title: 'Pre-built AI Agents',
      desc: 'Plug-and-play agents tailored for common workflows — sales, support, research and more.',
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

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-20">
        <h2 className="text-4xl font-semibold text-foreground">Build chat assistants that fit your workflow</h2>
        <p className="text-primary-text-faded mt-4 text-sm">Create, customize and share chatbots for sales, support, marketing and more; no infra required.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {features.map((f) => {
          const Icon = f.icon
          return (
            <div key={f.title} className="relative bg-card border border-border cursor-pointer rounded-xl p-8 hover:border-muted-foreground/40 hover:shadow-sm transition-all duration-200">
              <div className="absolute inset-0 opacity-60 rounded-xl" />
              <div className="relative">
                <Icon className="w-6 h-6 text-muted-foreground mb-5" strokeWidth={1.5} />
                <h3 className="text-lg font-medium text-foreground mb-2">{f.title}</h3>
                <p className="text-primary-text-faded text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}