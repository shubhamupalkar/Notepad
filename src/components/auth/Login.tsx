import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Lock, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import logo from '../../assets/logo.png';

interface LoginProps {
  onToggleAuthMode: () => void;
}

export const Login: React.FC<LoginProps> = ({ onToggleAuthMode }) => {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message || 'Failed to sign in. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const { error: signInError } = await signInWithGoogle();
    if (signInError) {
      setError(signInError.message || 'Failed to sign in with Google.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 select-text">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-[#986ddb]/15 rounded-[32px] p-8 md:p-10 shadow-[0_16px_48px_rgba(152,109,219,0.12)]">
        
        {/* Brand */}
        <div className="text-center mb-8 select-none">
          <img src={logo} alt="Purple Notes Logo" className="h-16 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#221733] tracking-tight">
            Welcome Back
          </h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-xs text-rose-600 font-medium">
            <AlertCircle size={15} className="shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#221733]/60 uppercase tracking-wider ml-1 select-none">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#221733]/30">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/50 border border-[#986ddb]/10 outline-none focus:border-[#986ddb] focus:bg-white text-sm text-[#221733] transition-all placeholder:text-[#221733]/30 shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#221733]/60 uppercase tracking-wider ml-1 select-none">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#221733]/30">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/50 border border-[#986ddb]/10 outline-none focus:border-[#986ddb] focus:bg-white text-sm text-[#221733] transition-all placeholder:text-[#221733]/30 shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-2xl bg-[#986ddb] hover:bg-[#8557c7] active:bg-[#7446b5] text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 select-none"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Or continue with separator */}
        <div className="flex items-center my-5 select-none">
          <div className="flex-grow border-t border-[#986ddb]/10"></div>
          <span className="px-3 text-[10px] font-bold text-[#221733]/40 uppercase tracking-widest">Or continue with</span>
          <div className="flex-grow border-t border-[#986ddb]/10"></div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-white/50 hover:bg-white/80 active:bg-white/95 border border-[#986ddb]/15 hover:border-[#986ddb]/25 text-[#221733]/85 hover:text-[#221733] text-sm font-bold shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2.5 select-none disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Sign In with Google</span>
        </button>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#986ddb]/10 text-center select-none">
          <p className="text-xs text-[#221733]/50 font-medium">
            Don't have an account?{' '}
            <button
              onClick={onToggleAuthMode}
              className="text-[#986ddb] font-bold hover:underline cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
