import { Settings } from "lucide-react";
export default function SettingsIcon () {
    return (
        <button  className="p-2 text-sm text-foreground rounded-xl hover:bg-primary-hover transition-colors cursor-pointer ">
        <Settings className="w-5 h-5"/>
      </button>
    )
}