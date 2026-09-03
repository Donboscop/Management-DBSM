import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Lock, Eye, EyeOff, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import type { Role } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../services/api';

interface OtpVerificationProps {
  email: string;
  role: Role;
  initialCooldown?: number;
  onSuccess: (token: string, user: any) => void;
  onChangeEmail: () => void;
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({
  email,
  role,
  initialCooldown = 60,
  onSuccess,
  onChangeEmail,
}) => {
  const [stage, setStage] = useState<'VERIFY_OTP' | 'SET_PASSWORD'>('VERIFY_OTP');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Set Password Form State
  const [verifiedAuth, setVerifiedAuth] = useState<{ token: string; user: any; otp: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSavedSuccess, setPasswordSavedSuccess] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (stage === 'VERIFY_OTP') {
      inputsRef.current[0]?.focus();
    }
  }, [stage]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    if (error) setError(null);

    if (cleaned && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== '')) {
      verifyCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    if (error) setError(null);

    const nextEmpty = newDigits.findIndex((d) => !d);
    if (nextEmpty !== -1) {
      inputsRef.current[nextEmpty]?.focus();
    } else {
      inputsRef.current[5]?.focus();
      verifyCode(newDigits.join(''));
    }
  };

  const verifyCode = async (otpCode: string) => {
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.verifyOtp(email, otpCode, role);
      setVerifiedAuth({ token: res.token, user: res.user, otp: otpCode });
      // Transition to Set Password stage
      setStage('SET_PASSWORD');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const res = await api.requestOtp(email, role);
      setCooldown(res.cooldownSeconds || 60);
      setResendSuccess(true);
      setDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!verifiedAuth) return;

    setIsSavingPassword(true);
    setError(null);

    try {
      await api.setPassword({
        email,
        newPassword,
        otp: verifiedAuth.otp,
      });
      setPasswordSavedSuccess(true);
      setTimeout(() => {
        onSuccess(verifiedAuth.token, verifiedAuth.user);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to set password');
      setIsSavingPassword(false);
    }
  };

  const handleSkipPassword = () => {
    if (verifiedAuth) {
      onSuccess(verifiedAuth.token, verifiedAuth.user);
    }
  };

  const isComplete = digits.every((d) => d !== '');

  return (
    <div className="w-full text-center animate-fadeIn">
      {/* Back / Change Email Action */}
      {stage === 'VERIFY_OTP' && (
        <button
          type="button"
          onClick={onChangeEmail}
          className="inline-flex items-center text-xs tracking-wider text-white/50 hover:text-white mb-5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Change email address
        </button>
      )}

      {/* Surface Panel */}
      <div className="p-8 sm:p-10 rounded-3xl glass-panel shadow-2xl relative overflow-hidden">
        {/* Top subtle golden shimmer */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

        {/* STAGE 1: ENTER & VERIFY OTP */}
        {stage === 'VERIFY_OTP' && (
          <>
            <div className="mb-6 text-center">
              <span className="inline-block px-3 py-1 mb-3 text-[10px] font-medium tracking-[0.25em] uppercase text-white/80 bg-white/10 rounded-full border border-white/10">
                Security Verification
              </span>
              <h2
                className="font-heading font-medium tracking-tight text-white mb-2"
                style={{ fontSize: 'clamp(26px, 4vw, 38px)' }}
              >
                Verify your email
              </h2>
              <p className="text-xs sm:text-sm text-white/60 font-light tracking-wide max-w-sm mx-auto">
                We sent a 6-digit access code to
              </p>
              <div className="mt-1 text-sm font-medium text-amber-200 tracking-wide">
                {email}
              </div>
            </div>

            {/* 6-Digit OTP Inputs */}
            <div className="my-7 flex justify-center items-center gap-2 sm:gap-3">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                  className={`w-11 sm:w-14 h-14 sm:h-16 text-center text-xl sm:text-2xl font-mono font-medium rounded-2xl glass-input text-white transition-all outline-none ${
                    digit
                      ? 'border-amber-400/60 bg-white/15 shadow-[0_0_15px_rgba(243,192,102,0.25)]'
                      : 'border-white/15'
                  } ${error ? 'border-red-500/80 bg-red-500/10' : ''}`}
                />
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center justify-center gap-2 mb-5 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Resend success notification */}
            {resendSuccess && (
              <div className="flex items-center justify-center gap-2 mb-5 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>New 6-digit security code dispatched.</span>
              </div>
            )}

            {/* Submit button */}
            <Button
              onClick={() => verifyCode(digits.join(''))}
              size="lg"
              variant="primary"
              isLoading={isLoading}
              disabled={!isComplete || isLoading}
              className="w-full"
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </Button>

            {/* Resend & Timer Controls */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 pt-5 border-t border-white/10 gap-3">
              <div>
                Didn't receive code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending}
                  className={`font-medium tracking-wide transition-colors ${
                    cooldown > 0
                      ? 'text-white/30 cursor-not-allowed'
                      : 'text-amber-300 hover:text-amber-200 underline cursor-pointer'
                  }`}
                >
                  {isResending ? (
                    <span className="inline-flex items-center">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Sending...
                    </span>
                  ) : (
                    'Resend code'
                  )}
                </button>
              </div>

              {cooldown > 0 && (
                <div className="text-[11px] text-white/40 tracking-wider">
                  Resend available in <span className="text-white font-mono">{cooldown}s</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* STAGE 2: SET PASSWORD PROMPT */}
        {stage === 'SET_PASSWORD' && (
          <div className="animate-fadeIn">
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 text-[10px] font-medium tracking-[0.25em] uppercase text-emerald-300 bg-emerald-400/10 rounded-full border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Email Verified
              </span>
              <h2
                className="font-heading font-medium tracking-tight text-white mb-2"
                style={{ fontSize: 'clamp(26px, 4vw, 36px)' }}
              >
                Set Your Password
              </h2>
              <p className="text-xs sm:text-sm text-white/60 font-light tracking-wide max-w-sm mx-auto">
                Create a custom password to log in directly next time without waiting for an email OTP code.
              </p>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4 text-left">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min. 6 chars)..."
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isSavingPassword}
                  icon={<Lock className="w-4 h-4" />}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-10 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password..."
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSavingPassword}
                icon={<KeyRound className="w-4 h-4" />}
                required
              />

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {passwordSavedSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Password saved successfully! Redirecting to portal...</span>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                variant="primary"
                isLoading={isSavingPassword}
                className="w-full mt-2"
              >
                {isSavingPassword ? 'Saving Password...' : 'Save Password & Continue'}
                {!isSavingPassword && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleSkipPassword}
                  className="text-xs text-white/45 hover:text-white underline transition-colors cursor-pointer"
                >
                  Skip for now & Continue to Portal →
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
