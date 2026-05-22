import React from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { useNotepad } from '../../hooks/useNotepad';
import { FileText } from 'lucide-react';

export const AboutDialog: React.FC = () => {
  const { state, closeDialog } = useNotepad();

  return (
    <Dialog
      isOpen={state.dialogs.about}
      onClose={() => closeDialog('about')}
      title="About Notepad Online"
      size="sm"
    >
      <div className="flex flex-col items-center text-center p-2">
        {/* Brand Logo/Icon */}
        <div className="w-14 h-14 bg-zinc-100 flex items-center justify-center text-zinc-700 mb-4 border border-[#b0b0b0]">
          <FileText className="w-8 h-8" />
        </div>

        {/* Title & Version */}
        <h4 className="text-lg font-bold text-black">
          Notepad Online
        </h4>
        <p className="text-xs text-zinc-550 font-mono mt-0.5 mb-4">
          Version 1.0.0 (Classic Edition)
        </p>

        {/* Description */}
        <p className="text-zinc-700 text-sm leading-relaxed mb-5">
          A high-performance, retro-inspired document editor combining classic desktop layouts with modern rich text capabilities.
        </p>

        {/* Stack info */}
        <div className="w-full bg-[#fcfcfc] border border-[#cccccc] p-3 text-left text-xs space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-550 font-medium">Framework:</span>
            <span className="text-zinc-800">React 19 + TypeScript</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-550 font-medium">Styling:</span>
            <span className="text-zinc-800">Tailwind CSS v4 (Classic Theme)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-550 font-medium">Editor Engine:</span>
            <span className="text-zinc-800">TipTap ProseMirror</span>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-[11px] text-zinc-500 my-4">
          &copy; {new Date().getFullYear()} Antigravity Systems. All rights reserved.
        </p>

        {/* Confirm Trigger */}
        <Button
          variant="primary"
          className="w-full py-2"
          onClick={() => closeDialog('about')}
        >
          OK
        </Button>
      </div>
    </Dialog>
  );
};

