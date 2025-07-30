import { ExternalLink } from "lucide-react";
import CategoryTag from "./category-tag";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import SignInPopup from "../signin-popup";
import Portal from "./portal";
import { useState } from "react";

interface BotCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function BotCard({
  id,
  name,
  description,
  category,
}: BotCardProps) {
    const {user} = useAuth();
    const [showSignInPopup, setShowSignInPopup] = useState(false);
    
    return (
      <>
        <div className="rounded-2xl border border-border text-foreground shadow-sm bg-card transition-all duration-300 hover:scale-[1.02] hover:bg-card-hover">
          <div className="flex flex-col space-y-3 p-6">
            <div role="heading" aria-level={3} className="font-semibold leading-none tracking-tight text-lg">
              {name}
            </div>
            <p className="text-sm text-primary-text-faded line-clamp-2 h-10">
              {description}
            </p>
            <div className="flex items-center justify-between">
              <CategoryTag category={category} />
              {user ? (
                <Link href={`/chat?id=${id}`}>
                  <ExternalLink size={18} className="text-foreground hover:text-primary-text-hover transition-colors duration-150" />
                </Link>
              ) : (
                <button 
                  onClick={() => setShowSignInPopup(true)}
                  className="text-foreground hover:text-primary-text-hover transition-colors duration-150"
                >
                  <ExternalLink size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
        {showSignInPopup && !user && (
          <Portal>
            <SignInPopup onClose={() => setShowSignInPopup(false)} />
          </Portal>
        )}
      </>
    );
}
