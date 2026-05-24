import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import OTPVerification from './OTPVerification';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import ExecutiveDashboard from './ExecutiveDashboard';

interface AuthPageProps {
  onBack: () => void;
}

type AuthStep = 'login' | 'signup' | 'otp' | 'dashboard';
type UserRole = 'admin' | 'employee' | 'executive';

export default function AuthPage({ onBack }: AuthPageProps) {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('employee');

  const handleSignupSubmit = (userEmail: string) => {
    setEmail(userEmail);
    setStep('otp');
  };

  const handleVerified = (role: UserRole) => {
    setUserRole(role);
    setStep('dashboard');
  };

  const handleBackFromOtp = () => {
    setStep('signup');
  };

  const handleLoginSuccess = (role: UserRole) => {
    setUserRole(role);
    setStep('dashboard');
  };

  const handleLogout = () => {
    setStep('login');
    setEmail('');
    setUserRole('employee');
  };

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 'login' ? (
          <motion.div
            key="login"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <LoginForm 
              onSwitchToSignup={() => setStep('signup')} 
              onBack={onBack}
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        ) : step === 'signup' ? (
          <motion.div
            key="signup"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <SignupForm 
              onSwitchToLogin={() => setStep('login')} 
              onBack={onBack}
              onSubmit={handleSignupSubmit}
            />
          </motion.div>
        ) : step === 'otp' ? (
          <motion.div
            key="otp"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <OTPVerification 
              email={email}
              onVerified={(role) => {
                setUserRole(role);
                setStep('dashboard');
              }}
              onBack={handleBackFromOtp}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {userRole === 'admin' && <AdminDashboard onLogout={handleLogout} />}
            {userRole === 'employee' && <EmployeeDashboard onLogout={handleLogout} />}
            {userRole === 'executive' && <ExecutiveDashboard onLogout={handleLogout} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
