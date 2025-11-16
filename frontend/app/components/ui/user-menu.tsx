'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, ArrowUpCircle, LogOut, Info, History } from 'lucide-react';
import { toast } from 'sonner';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import UsageHistoryPopup from '../usage-history';
import { Button } from './button';

interface UserMenuProps {
  name: string;
  email: string;
  picture?: string;
}

export default function UserMenu({ name, email, picture }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [showUsageHistory, setShowUsageHistory] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    setOpen(false);
  }

  return (
    <div className="relative inline-block text-left">
      <Button
        className='gap-2'
        onClick={() => setOpen(!open)}
      >
        {picture ? (
          <img src={picture} alt={name} className="w-6 h-6 rounded-full border border-border" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-background text-foreground flex items-center justify-center font-bold uppercase">
            {name?.charAt(0)}
          </div>
        )}
        <span className="text-sm text-background">{name}</span>
      </Button>

      {open && (
        <div className="absolute bg-card right-0 mt-2 w-64 origin-top-right rounded-lg border border-border bg-card shadow-lg z-50">
          <div className="p-4">
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="text-xs text-primary-text-faded">{email}</p>
          </div>

          <div className="border-t border-[var(--border)]">
            <button className="w-full cursor-pointer text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
            onClick={() => {
              setOpen(false);
              router.push('/settings');
            }}>
                <Settings className="inline mr-2 w-4 h-4" />
              Settings
            </button>
            <button className="w-full cursor-pointer text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
            onClick={() => router.push('/upgrade')}>  
                <ArrowUpCircle className="inline mr-2 w-4 h-4" />
              Upgrade plan
            </button>
            <button className="w-full cursor-pointer text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
            onClick={() => setShowUsageHistory(true)}>
                <History className="inline mr-2 w-4 h-4" />
              Usage History
            </button>
            <button className="w-full cursor-pointer text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors">
                <Info className='inline mr-2 w-4 h-4' />
              Learn more
            </button>
            <button className="w-full cursor-pointer text-left px-4 py-2 text-sm text-red-500 hover:bg-[var(--card-hover)] transition-colors" onClick={handleLogout}>
                <LogOut className="inline mr-2 w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    {showUsageHistory && typeof window !== 'undefined' && ReactDOM.createPortal(
      <UsageHistoryPopup onClose={() => setShowUsageHistory(false)} />,
      document.body
    )}
  </div>
  );
}
