import React from 'react';
import { User } from 'lucide-react';
import UserMenu from './user-menu';

interface SignInButtonProps {
  onSignInClick: () => void;
  user?: { username: string; email:string; picture?: string } | null;
  loading?: boolean;
}

export default function SignInButton({ onSignInClick, user, loading }: SignInButtonProps) {
  if (loading) {
    return <div className="w-5 h-5 animate-spin rounded-full border-2 border-border border-t-transparent" />;
  }
  if (user) {
    return (
      <div>
        <UserMenu name={user.username} email={user.email} picture={user.picture} />
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