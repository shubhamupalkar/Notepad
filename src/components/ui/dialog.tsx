import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Esc key listener to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
    >
      <div
        ref={dialogRef}
        className={`
          w-full ${sizes[size]} rounded-none border-2 border-[#7a7a7a]
          bg-white shadow-[4px_4px_10px_rgba(0,0,0,0.25)] overflow-hidden
        `}
      >
        {/* Header - Retro Title Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#cccccc] bg-[#eaeaea] select-none">
          <span className="text-xs font-bold text-black font-sans">
            {title}
          </span>
          <Button
            variant="secondary"
            onClick={onClose}
            className="text-black hover:bg-[#eb5757] hover:text-white h-5 w-5 p-0 flex items-center justify-center border border-[#999999] rounded-none focus:outline-none"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 text-xs text-[#000000] font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};
