"use client";

import { ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "./button";

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
        <Button 
            onClick={handleClick}
            size="lg"
            className="gap-2 hover:gap-3 transition-all duration-200"
        >
            Get Started
            <ArrowRight className="w-5 h-5" />
        </Button>
    )
}