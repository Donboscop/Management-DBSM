import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, Info } from 'lucide-react';
import type { Role } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

interface EmailFormProps {
  role: Role;
  onBack: () => void;
  onOtpRequested: (email: string, cooldown: number, expiresAt: string, devOtp?: string) => void;
}

export const EmailForm: React.FC<EmailFormProps> = ({ role, onBack, onOtpRequested }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === 'ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Please enter your email address');
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
      onOtpRequested(cleanEmail, res.cooldownSeconds || 60, res.expiresAt, res.devOtp);
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
            {isAdmin ? 'Verify your credentials' : 'Access your profile'}
          </h2>
          <p className="text-xs sm:text-sm text-white/60 font-light tracking-wide max-w-sm mx-auto">
            {isAdmin
              ? 'Enter your registered administrator email to receive a secure 6-digit access code.'
              : 'Enter your institutional registered email to receive your passwordless access code.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder={isAdmin ? 'admin@donbosco.edu' : 'student@gmail.com'}
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
            {isLoading ? 'Sending code...' : 'Send verification code'}
            {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </form>

        {/* Guidance badge */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center text-[11px] text-white/45 gap-2">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isAdmin
              ? 'Sample admin: admin@donbosco.edu'
              : 'Sample student: donbosco@gmail.com'}
          </span>
        </div>
      </div>
    </div>
  );
};
