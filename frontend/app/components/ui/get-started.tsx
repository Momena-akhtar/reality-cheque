"use client";

import { ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function GetStarted() {
    const { user } = useAuth();
    const router = useRouter();

    const handleClick = () => {
        if (user) {
            // If signed in, scroll to explore section
            const exploreSection = document.getElementById("explore");
            if (exploreSection) {
                exploreSection.scrollIntoView({ behavior: "smooth" });
            }
        } else {
            // If not signed in, navigate to signin page
            router.push("/signin");
        }
    };

    return (
        <button 
            onClick={handleClick}
            className="px-6 py-3 text-md cursor-pointer font-semibold bg-primary border-1 border-border text-foreground rounded-xl hover:bg-primary-hover hover:border-primary-hover transition-all duration-300 flex items-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] hover:-translate-y-[1px]"
        >
            <ArrowRight className="w-5 h-5" />
            Get Started
        </button>
    )
}