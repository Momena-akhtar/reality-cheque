import { ArrowRight } from "lucide-react";

export default function GetStarted() {
    return (
        <button className="px-6 py-3 text-md cursor-pointer font-semibold bg-primary border-1 border-border text-foreground rounded-xl hover:bg-primary-hover hover:border-primary-hover transition-all duration-300 flex items-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] hover:-translate-y-[1px]">
            <ArrowRight className="w-5 h-5" />
            Get Started
        </button>
    )
}