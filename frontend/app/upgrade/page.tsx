import PricingGrid from "../components/ui/pricing-grid"
export default function Upgrade(){
    return (
        <main className="min-h-screen bg-background text-foreground">
            <h1 className="text-center mt-10 text-3xl font-semibold">Plans that grow with you</h1>
      <PricingGrid />
    </main>
    )
}