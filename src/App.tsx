import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { Role } from './types';
import { AuthLayout } from './components/auth/AuthLayout';
import { PortalSelector } from './components/auth/PortalSelector';
import { EmailForm } from './components/auth/EmailForm';
import { OtpVerification } from './components/auth/OtpVerification';
import { AdminPortal } from './components/portals/AdminPortal';
import { StudentPortal } from './components/portals/StudentPortal';

type AuthStep = 'PORTAL_SELECT' | 'EMAIL_ENTRY' | 'OTP_VERIFY';

const AppContent: React.FC = () => {
  const { user, login, isLoading } = useAuth();

  const [step, setStep] = useState<AuthStep>('PORTAL_SELECT');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(60);

  // If already authenticated, display corresponding portal
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white/50 text-xs tracking-widest uppercase">
        Initializing secure gateway...
      </div>
    );
  }

  if (user) {
    if (user.role === 'ADMIN') {
      return <AdminPortal />;
    }
    return <StudentPortal />;
  }

  // Handle flow transitions
  const handleSelectPortal = (role: Role) => {
    setSelectedRole(role);
    setStep('EMAIL_ENTRY');
  };

  const handleOtpRequested = (email: string, cooldown: number) => {
    setPendingEmail(email);
    setCooldownSeconds(cooldown);
    setStep('OTP_VERIFY');
  };

  const handleAuthSuccess = (token: string, userData: any) => {
    login(token, userData);
  };

  return (
    <AuthLayout>
      {step === 'PORTAL_SELECT' && (
        <PortalSelector onSelectPortal={handleSelectPortal} />
      )}

      {step === 'EMAIL_ENTRY' && selectedRole && (
        <EmailForm
          role={selectedRole}
          onBack={() => setStep('PORTAL_SELECT')}
          onOtpRequested={handleOtpRequested}
        />
      )}

      {step === 'OTP_VERIFY' && selectedRole && (
        <OtpVerification
          email={pendingEmail}
          role={selectedRole}
          initialCooldown={cooldownSeconds}
          onSuccess={handleAuthSuccess}
          onChangeEmail={() => setStep('EMAIL_ENTRY')}
        />
      )}
    </AuthLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
