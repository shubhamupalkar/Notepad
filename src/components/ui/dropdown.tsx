import React, { useEffect, useRef } from 'react';

interface DropdownItemProps {
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  checked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  label,
  shortcut,
  icon,
  checked,
  disabled = false,
  onClick,
  variant = 'default',
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick && !disabled) onClick();
      }}
      className={`
        w-full flex items-center justify-between px-3 py-1.5 text-xs text-left
        cursor-default select-none disabled:opacity-40 disabled:pointer-events-none
        ${variant === 'danger' 
          ? 'hover:bg-rose-50 text-rose-600' 
          : 'hover:bg-[#eaeaea] text-black'
        }
      `}
    >
      <div className="flex items-center gap-2">
        {checked !== undefined ? (
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-black">
            {checked && (
              <svg className="w-3 h-3 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        ) : (
          icon && <span className="text-[#666666] w-3.5 h-3.5 flex items-center justify-center">{icon}</span>
        )}
        <span className={checked !== undefined ? 'ml-0' : icon ? 'ml-0' : 'ml-4.5'}>{label}</span>
      </div>
      {shortcut && (
        <span className="text-[10px] text-zinc-400 font-mono ml-6">
          {shortcut}
        </span>
      )}
    </button>
  );
};

export const DropdownDivider: React.FC = () => (
  <div className="h-[1px] bg-[#dcdcdc] my-1" />
);

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  align = 'left',
  className = '',
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`
        absolute z-50 mt-0.5 min-w-[200px] max-w-[280px] rounded-none border
        border-[#999999] bg-white shadow-[2px_2px_3px_rgba(0,0,0,0.15)] p-0.5
        ${align === 'left' ? 'left-0' : 'right-0'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
