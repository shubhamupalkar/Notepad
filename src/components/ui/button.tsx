import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  active?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'secondary', size = 'md', active = false, children, ...props }, ref) => {
    // Rigid desktop base styles with box borders and dotted-focus look
    const baseStyles = 'inline-flex items-center justify-center font-sans text-black border rounded-[2px] cursor-default select-none focus:outline-dotted focus:outline-1 focus:outline-zinc-500 disabled:opacity-40 disabled:pointer-events-none transition-colors';
    
    const variants = {
      primary: 'bg-[#404040] hover:bg-[#202020] text-white border-[#303030]',
      secondary: active
        ? 'bg-[#d8d8d8] border-[#999999] shadow-inner'
        : 'bg-[#fafafa] hover:bg-[#eaeaea] active:bg-[#e0e0e0] border-[#cccccc]',
      outline: 'bg-transparent border-[#cccccc] hover:bg-[#eaeaea] text-[#333333]',
      ghost: active
        ? 'bg-[#d2d2d2] border-[#a0a0a0] shadow-inner text-[#000000]'
        : 'bg-transparent border-transparent hover:bg-[#e8e8e8] active:bg-[#dcdcdc] text-[#333333]',
      danger: 'bg-[#eb5757] hover:bg-[#d83a3a] text-white border-[#d83a3a]',
    };

    const sizes = {
      sm: 'text-xs px-2 py-0.5 gap-1',
      md: 'text-sm px-3 py-1 gap-1.5',
      lg: 'text-base px-4 py-1.5 gap-2',
      icon: 'h-6.5 w-6.5 p-0 border-transparent', // very compact toolbar style
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button
        ref={ref}
        className={combinedClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
