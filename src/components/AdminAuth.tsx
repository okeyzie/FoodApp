import React, { useState } from 'react';
import { ShieldAlert, Mail, Lock, User, Sparkles, LogIn } from 'lucide-react';
import { AdminAccount } from '../types';

interface AdminAuthProps {
  onLoginSuccess: (adminId: string, adminData?: AdminAccount) => void;
  admins: AdminAccount[];
  onUpdateAdmins?: (updatedAdmins: AdminAccount[]) => void;
}

export default function AdminAuth({ onLoginSuccess, admins, onUpdateAdmins }: AdminAuthProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpPasscode, setSignUpPasscode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotSimulatedOtp, setForgotSimulatedOtp] = useState('');
  const [forgotRealEmailSent, setForgotRealEmailSent] = useState(false);

  // Handle requesting reset code for admin
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    let serverResponded = false;
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      serverResponded = true;

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Request failed');
        return;
      }

      setForgotSimulatedOtp(data.otpCode || '');
      setForgotRealEmailSent(data.emailSent || false);
      setForgotStep(2);
      setSuccessMsg(data.emailSent 
        ? 'A 4-digit administrative reset code has been sent to your email.'
        : 'An admin 4-digit reset code has been generated.'
      );
    } catch (err: any) {
      if (serverResponded) {
        setError(err.message || 'An error occurred.');
        return;
      }
      // Local fallback simulation if offline
      const trimmedEmail = forgotEmail.trim().toLowerCase();
      const localAdmin = admins.find(a => a.email && a.email.toLowerCase() === trimmedEmail);
      if (localAdmin) {
        const simulatedCode = Math.floor(1000 + Math.random() * 9000).toString();
        if (onUpdateAdmins) {
          const updated = admins.map(a => a.id === localAdmin.id ? { ...a, resetOtpCode: simulatedCode } : a);
          onUpdateAdmins(updated);
        } else {
          localAdmin.resetOtpCode = simulatedCode;
        }

        setForgotSimulatedOtp(simulatedCode);
        setForgotRealEmailSent(false);
        setForgotStep(2);
        setSuccessMsg('Admin email matched locally. A secure 4-digit reset code is generated below.');
      } else {
        setError('Admin email not found or network connection failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle resetting admin password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotOtp || !forgotNewPassword) return;

    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    let serverResponded = false;
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPassword }),
      });
      serverResponded = true;

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Reset failed');
        return;
      }

      setSuccessMsg('Admin security credentials updated successfully!');
      setSignInEmail(forgotEmail);
      setSignInPassword(forgotNewPassword); // autofill
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotOtp('');
        setForgotNewPassword('');
        setSuccessMsg('Enter the deck with your newly configured security key.');
      }, 1500);
    } catch (err: any) {
      if (serverResponded) {
        setError(err.message || 'An error occurred during password update.');
        return;
      }
      // Offline fallback
      const trimmedEmail = forgotEmail.trim().toLowerCase();
      const localAdmin = admins.find(a => a.email && a.email.toLowerCase() === trimmedEmail);
      if (localAdmin && localAdmin.resetOtpCode === forgotOtp.trim()) {
        if (onUpdateAdmins) {
          const updated = admins.map(a => a.id === localAdmin.id ? { ...a, password: forgotNewPassword, resetOtpCode: undefined } : a);
          onUpdateAdmins(updated);
        } else {
          localAdmin.password = forgotNewPassword;
          localAdmin.resetOtpCode = undefined;
        }

        setSuccessMsg('Admin credentials updated successfully (Offline backup)!');
        setSignInEmail(forgotEmail);
        setSignInPassword(forgotNewPassword);
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotStep(1);
          setForgotEmail('');
          setForgotOtp('');
          setForgotNewPassword('');
          setSuccessMsg('Enter the deck with your newly configured security key.');
        }, 1500);
      } else {
        setError('Invalid reset token or network error.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle email/password sign-in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });

      let data;
      try {
        data = await res.json();
      } catch (err) {
        // Fallback for offline or local mode
        const localAdmin = admins.find(
          (a) => a.email.toLowerCase() === signInEmail.trim().toLowerCase() && a.password === signInPassword
        );
        if (localAdmin) {
          setSuccessMsg('Logged in successfully (Offline fallback)!');
          setTimeout(() => {
            onLoginSuccess(localAdmin.id, localAdmin);
          }, 800);
          return;
        }
        throw new Error('Connection failed. Please use offline demo accounts below.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Invalid admin credentials');
      }

      setSuccessMsg('Admin validated successfully! Loading live logistics...');
      setTimeout(() => {
        onLoginSuccess(data.id, data);
      }, 800);
    } catch (err: any) {
      // Fallback local matching
      const localAdmin = admins.find(
        (a) => a.email.toLowerCase() === signInEmail.trim().toLowerCase() && a.password === signInPassword
      );
      if (localAdmin) {
        setSuccessMsg('Logged in successfully (Offline mode)!');
        setTimeout(() => {
          onLoginSuccess(localAdmin.id, localAdmin);
        }, 800);
      } else {
        setError(err.message || 'Authentication error.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle admin account creation
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword || !signUpPasscode) {
      setError('Please fill in all registration fields, including the Business Authorization Passcode.');
      return;
    }

    const trimmedEmail = signUpEmail.trim().toLowerCase();
    
    // 1. Verify business email domain on frontend/offline fallback too
    if (!trimmedEmail.endsWith("@foodhub.com") && !trimmedEmail.endsWith("@foodhublagos.com")) {
      setError("Access Denied: Admin creation is strictly restricted to verified corporate domains (@foodhub.com or @foodhublagos.com).");
      return;
    }

    // 2. Verify business passcode on frontend/offline fallback too
    if (signUpPasscode !== "FOODHUB-CORP-SECURE-2026") {
      setError("Access Denied: Invalid Business Authorization Passcode. You must be an authorized staff with the corporate code.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signUpName,
          email: trimmedEmail,
          password: signUpPassword,
          businessPasscode: signUpPasscode,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (err) {
        // Fallback simulated local addition
        const newAdmin: AdminAccount = {
          id: `admin-${Date.now()}`,
          name: signUpName,
          email: trimmedEmail,
          password: signUpPassword,
          createdAt: new Date().toISOString()
        };
        setSuccessMsg('Admin account registered successfully (Local fallback)!');
        setTimeout(() => {
          onLoginSuccess(newAdmin.id, newAdmin);
        }, 1000);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccessMsg('Admin registered successfully! Welcome to the operations deck.');
      setTimeout(() => {
        onLoginSuccess(data.id, data);
      }, 1000);
    } catch (err: any) {
      // Offline fallback registration
      const newAdmin: AdminAccount = {
        id: `admin-${Date.now()}`,
        name: signUpName,
        email: trimmedEmail,
        password: signUpPassword,
        createdAt: new Date().toISOString()
      };
      setSuccessMsg('Admin account registered successfully (Offline mode)!');
      setTimeout(() => {
        onLoginSuccess(newAdmin.id, newAdmin);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo logins
  const handleAutofillDemo = () => {
    setSignInEmail('admin@foodhub.com');
    setSignInPassword('password123');
    setActiveTab('signin');
  };

  const handleInstantDemoRegister = () => {
    const randomId = Math.floor(100 + Math.random() * 900);
    setSignUpName(`Manager ${randomId}`);
    setSignUpEmail(`manager.${randomId}@foodhub.com`);
    setSignUpPassword('password123');
    setSignUpPasscode('FOODHUB-CORP-SECURE-2026');
    setActiveTab('signup');
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-xs font-bold text-rose-600 mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{showForgotPassword ? "Operational Security Override" : "Restricted Operations Deck"}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">
          {showForgotPassword ? "Admin Reset" : "FoodHub Console"}
        </h1>
        <p className="text-xs text-gray-500 font-semibold mt-1">
          {showForgotPassword 
            ? (forgotStep === 1 ? "Verify administrative identity via corporate domain email" : "Specify reset code and authorize new operational credentials")
            : "Authorized personnel login to modify systems, approve merchants, and inspect deliveries"}
        </p>
      </div>

      {/* Tabs */}
      {!showForgotPassword && (
        <div className="bg-gray-100 p-1.5 rounded-2xl flex mb-6 border border-gray-200/50">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setError(null); }}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              activeTab === 'signin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setError(null); }}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              activeTab === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Request Admin Credentials
          </button>
        </div>
      )}

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold mb-6 flex items-start gap-2.5">
          <span className="text-base leading-none">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold mb-6 flex items-start gap-2.5 animate-pulse">
          <span className="text-base leading-none">✔</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Forms Container */}
      <div className="bg-white border border-gray-200 shadow-xs rounded-3xl p-6 sm:p-8 space-y-6">
        {showForgotPassword ? (
          forgotStep === 1 ? (
            <form onSubmit={handleRequestResetCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>Authorized Admin Email</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. manager@foodhub.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-rose-500/40 text-gray-800 font-medium"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? 'Verifying Operational Record...' : 'Send Override Code 📩'}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setError(null); setSuccessMsg(null); }}
                  className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {forgotRealEmailSent ? (
                <div className="bg-emerald-50/80 border border-emerald-200/60 p-4 rounded-2xl text-center space-y-2">
                  <span className="text-xs text-emerald-800 font-extrabold flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider">
                    📩 Security Token Emailed
                  </span>
                  <p className="text-[11px] text-gray-600 font-semibold leading-relaxed">
                    We have dispatched your 4-digit token to <span className="text-emerald-950 font-bold">{forgotEmail}</span> via Brevo API.
                  </p>
                </div>
              ) : (
                forgotSimulatedOtp && (
                  <div className="bg-amber-50/60 border border-amber-200/50 p-4 rounded-2xl text-center space-y-1.5">
                    <span className="text-[10px] text-amber-800 font-extrabold uppercase font-mono tracking-wider block">🛠️ Security Sandbox Token</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="bg-rose-600 text-white font-mono font-black text-xs px-2.5 py-1 rounded-lg tracking-widest select-all cursor-pointer">
                        {forgotSimulatedOtp}
                      </span>
                    </div>
                  </div>
                )
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Enter 4-Digit Override Token</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="e.g. 1234"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-sm font-mono font-bold tracking-widest outline-none focus:border-rose-500/40 text-gray-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Specify New Password</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-rose-500/40 text-gray-800 font-medium"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? 'Authorizing Credentials...' : 'Set New Security Key 🛡️'}
                </button>

                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  Request another security code
                </button>
              </div>
            </form>
          )
        ) : activeTab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>Admin Email Address</span>
              </label>
              <input
                type="email"
                required
                placeholder="admin@foodhub.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-rose-500/40 text-gray-800 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Security Token / Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setForgotStep(1); setForgotEmail(signInEmail); setError(null); setSuccessMsg(null); }}
                  className="text-[10px] font-extrabold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-rose-500/40 text-gray-800 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Verifying Operational Signature...' : 'Enter deck 🔒'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Administrator Full Name</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Director Chukwuma"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-rose-500/40 text-gray-800 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>Official Admin Email Address</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. manager@foodhub.com"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-rose-500/40 text-gray-800 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span>Choose Admin Password</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-rose-500/40 text-gray-800 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <span className="text-rose-500 font-black">⚙️</span>
                <span>Business Authorization Passcode</span>
              </label>
              <input
                type="text"
                required
                placeholder="FOODHUB-CORP-SECURE-2026"
                value={signUpPasscode}
                onChange={(e) => setSignUpPasscode(e.target.value)}
                disabled={loading}
                className="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-rose-500/40 text-rose-950 font-mono font-bold"
              />
              <span className="block text-[9px] text-rose-600 font-bold leading-normal">
                ⚠️ Strictly restricted to verified company employees. Entering an invalid code will block account registration.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              <span>Provision Admin Account 🚀</span>
            </button>
          </form>
        )}

        {/* Instant Testing Helpers */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">Admin Dev Shortcuts</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleAutofillDemo}
            className="py-2.5 px-3 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-xl text-[10px] font-bold text-rose-700 transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-rose-500" />
            <span>Autofill Seed Admin</span>
          </button>

          <button
            type="button"
            onClick={handleInstantDemoRegister}
            className="py-2.5 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-700 transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Autofill New Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
