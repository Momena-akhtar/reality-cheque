'use client'
import { Code, Layers, Zap } from 'lucide-react'

export default function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Design a profile',
      desc: 'Create a persona, pick tone and set constraints — the building block for every assistant.',
      icon: Code
    },
    {
      num: '02',
      title: 'Connect data & tools',
      desc: 'Attach knowledge sources, integrations and templates so your bot answers accurately.',
      icon: Layers
    },
    {
      num: '03',
      title: 'Deploy & iterate',
      desc: 'Ship to users, collect feedback and refine prompts, workflows and responses.',
      icon: Zap
    }
  ]

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24 bg-muted/20" id="how-it-works">
      <div className="text-center max-w-2xl mx-auto mb-20">
        <h2 className="text-4xl font-semibold text-foreground">How it works</h2>
        <p className="text-primary-text-faded mt-4 text-lg">Three simple steps to build, connect and ship powerful chat assistants.</p>
      </div>

      <div className="relative flex items-start gap-4">
        {steps.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.title} className="flex items-center gap-4">
              <div className="flex-1 bg-card border border-border rounded-xl p-8 hover:border-muted-foreground/40 hover:shadow-sm transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <Icon className="w-5 h-5 text-muted-foreground" fill="currentColor" strokeWidth={1.5} />
                </div>
                
                <h3 className="text-xl font-medium text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>

              {/* Curved arrow between steps */}
              {i < steps.length - 1 && (
                <div className="flex-shrink-0 -mx-2">
                  <svg width="40" height="40" viewBox="0 0 40 40" className="text-border">
                    <path
                      d="M5 20 Q15 15, 25 20 L28 20 M28 20 L25 17 M28 20 L25 23"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}