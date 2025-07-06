import { Phone } from "lucide-react";   
export default function ContactSales() {
    return (
        <button className="px-4 py-2 text-md border cursor-pointer border-border text-foreground rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Contact Sales
        </button>
    )
}