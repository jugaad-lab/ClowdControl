'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LogOut, User, ChevronDown } from 'lucide-react';

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-red-900/50 text-red-300 border-red-800',
  member: 'bg-blue-900/50 text-blue-300 border-blue-800',
  viewer: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
}

export function UserMenu() {
  const { user, profile, role, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !user) return null;

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const initials = getInitials(profile?.display_name, user.email);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-7 h-7 rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
            {initials}
          </div>
        )}
        <span className="text-sm text-zinc-300 hidden sm:inline max-w-[120px] truncate">
          {displayName}
        </span>
        {role && (
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border hidden sm:inline ${roleBadgeColors[role] || roleBadgeColors.viewer}`}
          >
            {role}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
            {role && (
              <span
                className={`inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded border ${roleBadgeColors[role] || roleBadgeColors.viewer}`}
              >
                {role}
              </span>
            )}
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.push('/login');
                router.refresh();
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
