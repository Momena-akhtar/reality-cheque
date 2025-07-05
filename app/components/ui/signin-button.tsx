import { User } from "lucide-react";
export default function SignIn({ onSignInClick }: { onSignInClick: () => void }) {
  return (
    <button onClick={onSignInClick} className="px-4 py-2 text-sm border cursor-pointer border-border text-white rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2">
      <User className="w-4 h-4" />
      Sign In
    </button>
  );
}