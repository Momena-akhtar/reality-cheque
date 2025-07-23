import GetStarted from "./ui/get-started";
import ContactSales from "./ui/contact-sales";

export default function Hero() {
    return (
        <div className="max-w-2xl mx-auto py-20 px-4">
            <div className="space-y-5 text-center">
                <h1 className="text-5xl font-bold leading-tight">
                    Talk to the Right Bot,<br />
                    Every Time.
                </h1>
                <p className="text-lg text-primary-text-faded max-w-lg mx-auto">
                    Explore a plug-and-play interface for in-context, prompt-engineered AI agents
                </p>
                <div className="flex flex-col sm:flex-col md:flex-row gap-4 pt-10 justify-center">
                    <GetStarted />
                    <ContactSales />
                </div>
            </div>
        </div>
    )
}       