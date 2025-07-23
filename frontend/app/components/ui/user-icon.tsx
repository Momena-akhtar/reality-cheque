import { User } from "lucide-react"
export default function UserIcon () {
    return (
        <button className="p-2 text-sm text-foreground rounded-xl hover:bg-primary-hover transition-colors cursor-pointer ">
        <User className="w-5 h-5"/>
      </button>
    )
}