import React from 'react';
import { ShieldCheck, GraduationCap, ArrowRight } from 'lucide-react';
import type { Role } from '../../types';

interface PortalSelectorProps {
  onSelectPortal: (role: Role) => void;
}

export const PortalSelector: React.FC<PortalSelectorProps> = ({ onSelectPortal }) => {
  return (
    <div className="text-center animate-fadeIn">
      {/* Editorial Heading Typography */}
      <div className="mb-4">
        <span className="inline-block px-3.5 py-1 mb-4 text-[11px] font-medium tracking-[0.3em] uppercase text-amber-200/90 bg-amber-500/10 border border-amber-400/25 rounded-full backdrop-blur-md">
          Authentication Gateway
        </span>
        <h1
          className="font-heading font-medium tracking-tight text-white leading-none mb-3"
          style={{
            fontSize: 'clamp(38px, 6.2vw, 68px)',
          }}
        >
          Welcome back.
        </h1>
        <p className="text-sm sm:text-base text-white/65 font-light tracking-wide max-w-sm mx-auto">
          Choose your authorized portal to continue.
        </p>
      </div>

      {/* Portal Selection Action Cards / Pills */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-md mx-auto">
        {/* Admin Portal Button */}
        <button
          onClick={() => onSelectPortal('ADMIN')}
          className="group relative flex-1 flex flex-col items-center justify-center p-6 rounded-3xl glass-panel hover:bg-white/[0.12] hover:border-amber-300/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:bg-amber-400/20 group-hover:text-amber-200 transition-colors">
            <ShieldCheck className="w-6 h-6 text-white/80 group-hover:text-amber-200" />
          </div>
          <span className="font-heading text-lg font-medium text-white tracking-wide">
            Admin
          </span>
          <span className="text-[11px] text-white/50 tracking-wider uppercase mt-1">
            System Management
          </span>
          <div className="mt-4 flex items-center text-xs text-white/40 group-hover:text-amber-300 transition-colors">
            <span>Enter portal</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Student Portal Button */}
        <button
          onClick={() => onSelectPortal('STUDENT')}
          className="group relative flex-1 flex flex-col items-center justify-center p-6 rounded-3xl glass-panel hover:bg-white/[0.12] hover:border-amber-300/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:bg-amber-400/20 group-hover:text-amber-200 transition-colors">
            <GraduationCap className="w-6 h-6 text-white/80 group-hover:text-amber-200" />
          </div>
          <span className="font-heading text-lg font-medium text-white tracking-wide">
            Student
          </span>
          <span className="text-[11px] text-white/50 tracking-wider uppercase mt-1">
            Student Data & Duties
          </span>
          <div className="mt-4 flex items-center text-xs text-white/40 group-hover:text-amber-300 transition-colors">
            <span>Enter portal</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Security Note */}
      <div className="mt-8 text-[11px] text-white/40 tracking-wider flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-white/30"></span>
        Zero Passwords • 6-Digit Direct Verification Code
      </div>
    </div>
  );
};
