import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { Role } from '../../types';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

interface OtpVerificationProps {
  email: string;
  role: Role;
  initialCooldown?: number;
  devOtp?: string;
  onSuccess: (token: string, user: any) => void;
  onChangeEmail: () => void;
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({
  email,
  role,
  initialCooldown = 60,
  devOtp: initialDevOtp,
  onSuccess,
  onChangeEmail,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [currentDevOtp, setCurrentDevOtp] = useState<string | undefined>(initialDevOtp);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    // Only allow single numeric digit
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    if (error) setError(null);

    // Auto advance to next input
    if (cleaned && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // If all 6 digits filled, trigger verification automatically
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

    // Focus last filled digit or next empty digit
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
      onSuccess(res.token, res.user);
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
      if (res.devOtp) setCurrentDevOtp(res.devOtp);
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

  const isComplete = digits.every((d) => d !== '');

  return (
    <div className="w-full text-center animate-fadeIn">
      {/* Change Email Action */}
      <button
        type="button"
        onClick={onChangeEmail}
        className="inline-flex items-center text-xs tracking-wider text-white/50 hover:text-white mb-5 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Change email address
      </button>

      {/* Surface Panel */}
      <div className="p-8 sm:p-10 rounded-3xl glass-panel shadow-2xl relative overflow-hidden">
        {/* Top subtle golden shimmer */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

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

        {/* Development Mode Quick Code Helper */}
        {currentDevOtp && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                const arr = currentDevOtp.split('').slice(0, 6);
                setDigits(arr);
                verifyCode(currentDevOtp);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-300/40 text-amber-200 text-xs font-mono hover:bg-amber-400/25 transition-all cursor-pointer shadow-md"
            >
              <span>🔑 Test OTP: <strong className="tracking-widest text-white">{currentDevOtp}</strong></span>
              <span className="text-[10px] text-amber-300/70 uppercase">(Click to auto-fill)</span>
            </button>
          </div>
        )}

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
      </div>
    </div>
  );
};
