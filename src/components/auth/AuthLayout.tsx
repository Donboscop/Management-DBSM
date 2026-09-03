import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-black select-none">
      {/* 
        Full-Screen Background Image
        Natural colors preserved 100%, zero color grading/filters.
        Carefully centered to showcase the illuminated tri-circle crest, palm trees, and dusk sunset.
      */}
      <img
        src="/background.jpg"
        alt="Don Bosco Skill Mission facade"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 ease-out"
        style={{
          objectPosition: 'center 35%',
        }}
      />

      {/* 
        Subtle Cinematic Readability Mask
        Radial & Linear fade carefully calibrated so text achieves AAA contrast
        while the building facade, illuminated crest, and vibrant sunset remain clearly visible.
      */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(6, 9, 15, 0.45) 0%, rgba(6, 9, 15, 0.72) 100%), linear-gradient(to bottom, rgba(4, 6, 10, 0.6) 0%, transparent 25%, transparent 70%, rgba(4, 6, 10, 0.85) 100%)',
        }}
      />

      {/* Cinematic Header Navigation */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-7 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.png"
            alt="Don Bosco Tech Logo"
            className="w-10 h-10 object-contain rounded-xl bg-white/90 p-1 shadow-lg border border-white/20"
          />
          <div className="flex flex-col">
            <span className="font-heading text-lg sm:text-xl tracking-[0.2em] uppercase text-white font-semibold flex items-center gap-2">
              DON BOSCO SKILL MISSION<sup className="text-xs text-amber-300 font-normal">®</sup>
            </span>
            <span className="text-[10px] sm:text-xs text-white/50 tracking-[0.25em] uppercase font-light mt-0.5">
              Empowering Youths • Transforming Lives
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] text-white/70 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            PORTAL ACTIVE
          </div>
        </div>
      </header>

      {/* Main Interactive Content Centerpiece */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-[500px] transition-all duration-500 ease-out">
          {children}
        </div>
      </main>

      {/* Minimal Editorial Footer */}
      <footer className="relative z-10 w-full px-6 sm:px-12 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/45 tracking-wider gap-2">
        <div>
          © {new Date().getFullYear()} Don Bosco Skill Mission. All Rights Reserved.
        </div>
        <div className="flex items-center gap-6 text-[11px] uppercase tracking-widest text-white/40">
          <span>Official Institutional Gateway</span>
          <span>•</span>
          <span>Passwordless OTP Security</span>
        </div>
      </footer>
    </div>
  );
};
