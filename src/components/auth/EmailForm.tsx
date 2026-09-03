import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, ArrowRight, AlertCircle, Info, KeyRound, Eye, EyeOff } from 'lucide-react';
import type { Role } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

interface EmailFormProps {
  role: Role;
  onBack: () => void;
  onOtpRequested: (email: string, cooldown: number, expiresAt: string) => void;
  onSuccess: (token: string, user: any) => void;
}

export const EmailForm: React.FC<EmailFormProps> = ({ role, onBack, onOtpRequested, onSuccess }) => {
  const [authMode, setAuthMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === 'ADMIN';

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your registered email address');
      return;
    }
    if (!password) {
      setError('Please enter your account password');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.loginPassword(cleanEmail, password, role);
      if (res.token && res.user) {
        onSuccess(res.token, res.user);
      }
    } catch (err: any) {
      if (err.requireOtp) {
        // Smoothly redirect to OTP
        try {
          const otpRes = await api.requestOtp(cleanEmail, role);
          onOtpRequested(cleanEmail, otpRes.cooldownSeconds || 60, otpRes.expiresAt);
          return;
        } catch {}
      }
      setError(err.message || 'Incorrect email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address to receive an access code');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.requestOtp(cleanEmail, role);
      onOtpRequested(cleanEmail, res.cooldownSeconds || 60, res.expiresAt);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full text-center animate-fadeIn">
      {/* Back to Portal Choice */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center text-xs tracking-wider text-white/50 hover:text-white mb-5 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Back to portal selection
      </button>

      {/* Surface Panel */}
      <div className="p-8 sm:p-10 rounded-3xl glass-panel shadow-2xl relative overflow-hidden">
        {/* Subtle accent light */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />

        <div className="mb-6 text-center">
          <span className="inline-block px-3 py-1 mb-3 text-[10px] font-medium tracking-[0.25em] uppercase text-white/80 bg-white/10 rounded-full border border-white/10">
            {isAdmin ? 'Administrator Portal' : 'Student Portal'}
          </span>
          <h2
            className="font-heading font-medium tracking-tight text-white mb-2"
            style={{ fontSize: 'clamp(28px, 4.5vw, 42px)' }}
          >
            {authMode === 'PASSWORD' ? 'Sign in with Password' : 'Reset / OTP Access'}
          </h2>
          <p className="text-xs sm:text-sm text-white/60 font-light tracking-wide max-w-sm mx-auto">
            {authMode === 'PASSWORD'
              ? 'Enter your institutional email and password to log in.'
              : 'Enter your registered email to receive a secure one-time verification code.'}
          </p>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex items-center justify-center p-1 rounded-2xl bg-white/5 border border-white/10 mb-6 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => {
              setAuthMode('PASSWORD');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'PASSWORD'
                ? 'bg-amber-400 text-black font-semibold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('OTP');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'OTP'
                ? 'bg-amber-400 text-black font-semibold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>OTP Code</span>
          </button>
        </div>

        {/* PASSWORD LOGIN FORM */}
        {authMode === 'PASSWORD' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <Input
              type="email"
              placeholder={isAdmin ? 'donboscop24@gmail.com' : 'student@gmail.com'}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              autoFocus
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                icon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-left text-xs text-red-200 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>

            {/* Forgot Password Link */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('OTP');
                  setError(null);
                }}
                className="text-xs text-amber-300/80 hover:text-amber-200 underline transition-colors cursor-pointer"
              >
                Forgot password or need to sign in with OTP?
              </button>
            </div>
          </form>
        ) : (
          /* OTP ACCESS FORM */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              type="email"
              placeholder={isAdmin ? 'donboscop24@gmail.com' : 'student@gmail.com'}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              autoFocus
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-left text-xs text-red-200 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP verification code'}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('PASSWORD');
                  setError(null);
                }}
                className="text-xs text-white/50 hover:text-white underline transition-colors cursor-pointer"
              >
                Remember your password? Sign in with password
              </button>
            </div>
          </form>
        )}

        {/* Default credentials note */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center text-[11px] text-white/45 gap-2">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isAdmin
              ? 'Default Admin Password: Admin@123 (or sign in with OTP)'
              : 'Default Student Password: Student@123 (or sign in with OTP)'}
          </span>
        </div>
      </div>
    </div>
  );
};
