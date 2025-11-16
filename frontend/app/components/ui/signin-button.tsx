import React from 'react';
import UserMenu from './user-menu';
import { Button } from './button';

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
    <Button
      onClick={onSignInClick}
>
      Sign In
    </Button>
  );
}