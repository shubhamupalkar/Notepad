import React from 'react';
import { Cloud, FileText, Trash2, LogOut, User } from 'lucide-react';

interface SidebarProps {
  currentTab: 'notes' | 'trash';
  onTabChange: (tab: 'notes' | 'trash') => void;
  notesCount: number;
  trashCount: number;
  userEmail: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  notesCount,
  trashCount,
  userEmail,
  onLogout,
}) => {
  // Extract simple display name from email (before the @ symbol)
  const displayName = userEmail.split('@')[0];

  return (
    <aside className="w-full md:w-64 bg-white/40 md:min-h-screen border-b md:border-b-0 md:border-r border-[#986ddb]/15 p-6 flex flex-col justify-between shrink-0 select-none backdrop-blur-md">
      
      {/* Brand & Menu */}
      <div className="space-y-8">
        
        {/* Brand */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-xl bg-[#986ddb] text-white flex items-center justify-center shadow-md">
            <Cloud size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#221733] tracking-tight leading-none">
              Cloud Notes
            </h1>
            <span className="text-[10px] text-[#221733]/40 font-mono mt-0.5 block font-bold">
              v2.0 (Auth Sync)
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1.5">
          <button
            onClick={() => onTabChange('notes')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'notes'
                ? 'bg-[#986ddb] text-white shadow-sm'
                : 'text-[#221733]/65 hover:bg-[#e4d1fb]/50 hover:text-[#221733]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText size={15} />
              <span>My Notes</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              currentTab === 'notes' ? 'bg-white/20 text-white' : 'bg-[#e4d1fb]/40 text-[#6d3bbd]'
            }`}>
              {notesCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('trash')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'trash'
                ? 'bg-[#986ddb] text-white shadow-sm'
                : 'text-[#221733]/65 hover:bg-[#e4d1fb]/50 hover:text-[#221733]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Trash2 size={15} />
              <span>Trash Bin</span>
            </div>
            {trashCount > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                currentTab === 'trash' ? 'bg-white/20 text-white' : 'bg-[#e4d1fb]/40 text-[#6d3bbd]'
              }`}>
                {trashCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* User Section & Logout */}
      <div className="mt-8 md:mt-0 pt-6 border-t border-[#986ddb]/10 space-y-4">
        
        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f1e5fe] flex items-center justify-center text-[#986ddb] border border-[#986ddb]/15 shrink-0 shadow-sm">
            <User size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-[#221733] truncate capitalize leading-tight">
              {displayName}
            </h4>
            <span className="text-[10px] text-[#221733]/45 truncate block">
              {userEmail}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50/50 hover:bg-rose-50 active:bg-rose-100 border border-rose-100/20 transition-all cursor-pointer select-none"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>

      </div>
    </aside>
  );
};
