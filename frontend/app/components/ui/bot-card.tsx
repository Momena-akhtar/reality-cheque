import { ExternalLink } from "lucide-react";
import CategoryTag from "./category-tag";
import PaidButton from "./paid-button";
import FreeButton from "./free-button";
import Link from "next/link";

interface BotCardProps {
  name: string;
  description: string;
  logo: string;
  category: string;
  version: "Free" | "Paid";
}

export default function BotCard({
  name,
  description,
  logo,
  category,
  version,
}: BotCardProps) {
  return (
    <div className="rounded-lg border border-border text-foreground shadow-sm bg-card transition-all duration-300 hover:scale-[1.02] hover:bg-card-hover">
    <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex justify-between">
            <img src={logo} alt={name} className="mb-2 h-10 w-10 rounded-md object-cover" />
        </div>
        <div role="heading" aria-level={3} className="font-semibold leading-none tracking-tight">
            {name}
        </div>
        <p className="text-sm text-primary-text-faded line-clamp-2 h-10">
            {description}
        </p>
    </div>
    <div className="flex items-center border-t border-border p-4">
        <div className="flex w-full items-center justify-between gap-2 text-muted-foreground">
            <div className="flex items-center gap-2">
                <CategoryTag category={category} />
                {version === "Free"? <FreeButton /> : <PaidButton />}
            </div>
            <Link href={`/chat/${name.toLowerCase().replace(/\s+/g, '-')}?title=${name}&description=${description}&logo=${logo}`}>
                <ExternalLink size={16} className="text-foreground hover:text-primary-text-hover transition-colors duration-150" />
            </Link>
        </div>
    </div>
   </div>
  );
}
