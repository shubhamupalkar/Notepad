import React from 'react';
import { useNotepad } from '../../hooks/useNotepad';
import { Check, ShieldAlert } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { state } = useNotepad();

  if (!state.view.statusBarVisible) return null;

  return (
    <div className="flex items-center justify-between border-t border-[#cccccc] bg-[#f3f3f3] text-xs text-zinc-700 font-sans select-none w-full h-6">
      {/* Left side info */}
      <div className="flex items-center h-full px-3 border-r border-[#cccccc] min-w-[120px] shrink-0">
        <span>Ln {state.stats.line}, Col {state.stats.column}</span>
      </div>

      {/* Word / Char Counts */}
      <div className="hidden sm:flex items-center h-full px-3 border-r border-[#cccccc] text-zinc-650 shrink-0">
        <span>{state.stats.wordCount} words</span>
        <span className="mx-2 text-zinc-300">|</span>
        <span>{state.stats.charCount} chars</span>
      </div>

      {/* Save Status Indicator */}
      <div className="flex-grow flex items-center h-full px-3 border-r border-[#cccccc]">
        {state.file.isDirty ? (
          <span className="flex items-center gap-1 text-amber-700 text-[11px] font-medium">
            <ShieldAlert className="w-3.5 h-3.5 stroke-[2] text-amber-600" />
            <span>Modified</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-700 text-[11px] font-medium">
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" />
            <span>Saved</span>
          </span>
        )}
      </div>

      {/* Zoom */}
      <div className="hidden md:flex items-center h-full px-3 border-r border-[#cccccc] min-w-[80px] justify-center shrink-0">
        <span>{state.view.zoom}%</span>
      </div>

      {/* OS Line Ending */}
      <div className="hidden sm:flex items-center h-full px-3 border-r border-[#cccccc] min-w-[120px] justify-center shrink-0">
        <span>Windows (CRLF)</span>
      </div>

      {/* Encoding */}
      <div className="flex items-center h-full px-4 min-w-[80px] justify-center shrink-0">
        <span>UTF-8</span>
      </div>
    </div>
  );
};

