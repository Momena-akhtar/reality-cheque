import React from 'react';
import { User } from 'lucide-react';

interface SignInButtonProps {
  onSignInClick: () => void;
  user?: { username: string; picture?: string } | null;
  loading?: boolean;
}

export default function SignInButton({ onSignInClick, user, loading }: SignInButtonProps) {
  if (loading) {
    return <div className="w-5 h-5 animate-spin rounded-full border-2 border-border border-t-transparent" />;
  }
  if (user) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 cursor-pointer rounded-xl border border-border bg-background text-foreground hover:bg-primary-hover transition-colors">
        {user.picture ? (
          <img src={user.picture} alt={user.username} className="w-5 h-5 rounded-full border border-border" />
        ) : (
          <User className="w-5 h-5" />
        )}
        <span className="font-medium">{user.username}</span>
      </div>
    );
  }
  return (
    <button
      onClick={onSignInClick}
      className="px-4 py-2 cursor-pointer rounded-xl border border-border bg-background text-foreground hover:bg-primary-hover transition-colors"
    >
      Sign In
    </button>
  );
}