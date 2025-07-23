'use client';

import { useState } from 'react';
import { Settings, ArrowUpCircle, LogOut, Info } from 'lucide-react';

interface UserMenuProps {
  name: string;
  email: string;
  picture?: string;
}

export default function UserMenu({ name, email, picture }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center cursor-pointer space-x-2 rounded-xl px-4 py-2 border border-border bg-[var(--primary)] text-[var(--foreground)] hover:bg-[var(--primary-hover)] transition-colors"
      >
        {picture ? (
          <img src={picture} alt={name} className="w-6 h-6 rounded-full border border-border" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-bold uppercase">
            {name?.charAt(0)}
          </div>
        )}
        <span className="text-sm">{name}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-md border border-[var(--border)] bg-[var(--card)] shadow-lg z-50">
          <div className="p-4">
            <p className="text-sm font-medium text-[var(--foreground)]">{name}</p>
            <p className="text-xs text-[var(--primary-text-faded)]">{email}</p>
          </div>

          <div className="border-t border-[var(--border)]">
            <button className="w-full cursor-pointer text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors">
                <Settings className="inline mr-2 w-4 h-4" />
              Settings
            </button>
            <button className="w-full cursor-pointer text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors">
                <ArrowUpCircle className="inline mr-2 w-4 h-4" />
              Upgrade plan
            </button>
            <button className="w-full cursor-pointer text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors">
                <Info className='inline mr-2 w-4 h-4' />
              Learn more
            </button>
            <button className="w-full cursor-pointer text-left px-4 py-2 text-sm text-red-500 hover:bg-[var(--card-hover)] transition-colors">
                <LogOut className="inline mr-2 w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
