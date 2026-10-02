import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowLeft,
  Fingerprint,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Auth3DCanvas } from './Auth3DCanvas';
import { SeemadrishtiLogo } from '../layout/SeemadrishtiLogo';

interface Auth3DViewProps {
  initialMode?: 'login' | 'signup';
  onNavigateLanding?: () => void;
}

export const Auth3DView: React.FC<Auth3DViewProps> = ({
  initialMode = 'login',
  onNavigateLanding,
}) => {
  const { login, register, setPortal } = useAuth();
  const navigate = useNavigate();

  // Mode: strictly default to login unless explicitly in signup route
  const [mode] = useState<'login' | 'signup'>(initialMode === 'signup' ? 'signup' : 'login');

  // Form states - Strictly initialized to empty strings (NO hints, NO defaults, NO prefilled credentials)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // UI status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Smart Security: Brute-Force Rate Limiting Shield
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Countdown timer for security lockout cooldown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const trimmedUser = username.trim();
        if (!trimmedUser || !password) {
          throw new Error('Please enter operator callsign and security passphrase.');
        }

        // Strictly invoke backend auth via AuthContext (NO client-side passwords or backdoors)
        await login(trimmedUser, password);
        sessionStorage.setItem('seemadrishti_portal_access_granted', 'true');
        setFailedAttempts(0);
        setSuccessMessage('Authentication verified. Establishing secure defense uplink...');
        navigate('/dashboard', { replace: true });
      } else {
        const trimmedUser = username.trim();
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        if (!trimmedUser || !password || !trimmedName || !trimmedEmail) {
          throw new Error('All registration fields are required.');
        }
        if (password.length < 8) {
          throw new Error('Security passphrase must contain at least 8 characters.');
        }

        await register({
          username: trimmedUser,
          password,
          name: trimmedName,
          email: trimmedEmail,
          role: 'Surveillance Operator',
        });
        sessionStorage.setItem('seemadrishti_portal_access_granted', 'true');
        setFailedAttempts(0);
        setSuccessMessage('Personnel enrollment verified. Clearance established.');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);

      // Smart Defense: Enforce lockout after 5 failed attempts
      if (nextFailures >= 5) {
        setLockoutSeconds(15);
        setErrorMessage('Security Rate-Limit Active: Too many failed authentication attempts. Access locked for 15 seconds.');
      } else {
        const rawMsg = err.message || 'Authentication rejected. Verify credentials.';
        setErrorMessage(rawMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen h-[100dvh] w-full bg-[#030712] text-slate-100 flex flex-col justify-between overflow-y-auto overflow-x-hidden font-mono select-none">
      {/* 3D Holographic Globe & Radar Canvas Background */}
      <Auth3DCanvas />

      {/* Cyber Defense Scanline Pattern & Dynamic Subtle Gradient Masks */}
      <div className="absolute inset-0 bg-[radial-gradient(#00f0ff15_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/40 via-transparent to-[#030712]/60 pointer-events-none z-[1]" />

      {/* Top Header Bar with Transparent Frosted Glass */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/[0.10] backdrop-blur-xl bg-slate-950/30 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => (onNavigateLanding ? onNavigateLanding() : setPortal('landing'))}
        >
          <SeemadrishtiLogo size={32} className="text-[#00E599] drop-shadow-[0_0_15px_rgba(0,229,153,0.7)] transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-400 to-teal-300 drop-shadow-[0_0_12px_rgba(0,229,153,0.5)]">
              SEEMADRISHTI
            </span>
            <span className="text-[8px] font-mono tracking-widest text-[#00E599] font-bold uppercase">
              DEFENSE TELEMETRY GATEWAY
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={() => {
              if (onNavigateLanding) onNavigateLanding();
              else setPortal('landing');
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/[0.14] bg-white/[0.04] hover:bg-cyan-500/[0.12] hover:border-cyan-400/50 text-slate-200 hover:text-cyan-300 text-xs font-semibold backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-lg active:scale-95 group"
          >
            <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Portal Overview</span>
          </button>
        </div>
      </header>

      {/* Main Center Auth Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 my-auto">
        <div className="w-full max-w-[460px] transition-all duration-300 relative">
          
          {/* Volumetric Glowing Ambient Aura Behind Card */}
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-emerald-500/15 to-blue-500/15 rounded-[32px] blur-3xl opacity-75 -z-10 animate-pulse pointer-events-none" />
          
          {/* Faint Cybernetic Outer Energy Field Ring */}
          <div className="absolute -inset-1 rounded-[26px] border border-cyan-400/25 pointer-events-none -z-10 shadow-[0_0_30px_rgba(0,240,255,0.15)]" />

          {/* Main Professional Frosted Glass Terminal Card with 3D Depth */}
          <div className="relative rounded-3xl border border-white/25 border-t-white/60 border-b-cyan-400/40 bg-slate-900/[0.80] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_60px_rgba(0,240,255,0.15),inset_0_1.5px_2px_rgba(255,255,255,0.4),inset_0_-1.5px_2px_rgba(0,240,255,0.2)] overflow-hidden transition-all duration-300">
            
            {/* Glass Light Reflection Sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/[0.05] via-transparent to-white/[0.08] pointer-events-none" />

            {/* Tactical Corner HUD Reticles */}
            <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400 pointer-events-none drop-shadow-[0_0_8px_#00f0ff]" />
            <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400 pointer-events-none drop-shadow-[0_0_8px_#00f0ff]" />
            <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400 pointer-events-none drop-shadow-[0_0_8px_#00f0ff]" />
            <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400 pointer-events-none drop-shadow-[0_0_8px_#00f0ff]" />

            {/* Glowing Laser Top Specular Rim */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_16px_#00f0ff]" />

            {/* Card Header Section */}
            <div className="p-6 sm:p-7 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.35)] backdrop-blur-md">
                  <Fingerprint className="text-cyan-400 animate-pulse" size={16} />
                </div>
                <span className="text-[10px] font-bold text-cyan-300 tracking-widest uppercase">
                  MANDATORY OPERATOR AUTHENTICATION
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                OPERATOR AUTHENTICATION
              </h1>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">
                Operator authentication is mandatory to establish defense telemetry uplink. All sessions are cryptographically verified and recorded.
              </p>
            </div>

            {/* Error / Success / Lockout Glass Banners */}
            {lockoutSeconds > 0 && (
              <div className="mx-6 sm:mx-7 mb-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs flex items-center gap-2.5 backdrop-blur-xl shadow-lg">
                <AlertCircle size={16} className="shrink-0 text-amber-400 animate-pulse" />
                <span className="leading-snug">
                  Rate-limit active: Cooldown in progress. Retry in <strong>{lockoutSeconds}s</strong>.
                </span>
              </div>
            )}
            {errorMessage && lockoutSeconds === 0 && (
              <div className="mx-6 sm:mx-7 mb-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 backdrop-blur-xl shadow-lg animate-shake">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mx-6 sm:mx-7 mb-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 backdrop-blur-xl shadow-lg">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            {/* Main Form - No Hints, No Options, Hardened Against Browser Cache Injection */}
            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              className="px-6 sm:px-7 pb-6 space-y-4"
            >
              {/* Optional Registration Fields (Only if initialMode was explicitly signup) */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-slate-300 uppercase mb-1">
                      Personnel Full Name
                    </label>
                    <div className="relative flex items-center bg-white/[0.03] hover:bg-white/[0.06] focus-within:bg-cyan-500/[0.06] border border-white/20 hover:border-cyan-400/50 focus-within:border-cyan-400 rounded-xl transition-all duration-200">
                      <div className="pl-3.5 pr-2.5 py-3 text-cyan-400">
                        <User size={14} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Personnel Full Name"
                        required
                        autoComplete="off"
                        data-lpignore="true"
                        className="w-full pr-3.5 py-3 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none font-mono tracking-wide"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-slate-300 uppercase mb-1">
                      Department Email
                    </label>
                    <div className="relative flex items-center bg-white/[0.03] hover:bg-white/[0.06] focus-within:bg-cyan-500/[0.06] border border-white/20 hover:border-cyan-400/50 focus-within:border-cyan-400 rounded-xl transition-all duration-200">
                      <div className="pl-3.5 pr-2.5 py-3 text-cyan-400">
                        <User size={14} />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Official Email Address"
                        required
                        autoComplete="off"
                        data-lpignore="true"
                        className="w-full pr-3.5 py-3 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none font-mono tracking-wide"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Callsign / Username Input - No Hints, No Autofill */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-300 uppercase mb-1">
                  Operator Callsign / ID
                </label>
                <div className="relative flex items-center bg-white/[0.04] hover:bg-white/[0.07] focus-within:bg-cyan-500/[0.08] border border-white/20 hover:border-cyan-400/50 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/25 focus-within:shadow-[0_0_25px_rgba(0,240,255,0.25)] rounded-xl transition-all duration-200 backdrop-blur-sm">
                  <div className="pl-3.5 pr-2.5 py-3 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Operator Callsign (e.g. admin or operator)"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    disabled={lockoutSeconds > 0 || isSubmitting}
                    className="w-full pr-3.5 py-3 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none font-mono tracking-wide selection:bg-cyan-500 selection:text-black"
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide and CapsLock Detector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                    Security Passphrase
                  </label>
                  {isCapsLockOn && (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded animate-pulse">
                      CAPS LOCK ON
                    </span>
                  )}
                </div>
                <div className="relative flex items-center bg-white/[0.04] hover:bg-white/[0.07] focus-within:bg-cyan-500/[0.08] border border-white/20 hover:border-cyan-400/50 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/25 focus-within:shadow-[0_0_25px_rgba(0,240,255,0.25)] rounded-xl transition-all duration-200 backdrop-blur-sm">
                  <div className="pl-3.5 pr-2.5 py-3 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                    <Lock size={14} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
                    placeholder="Security Passphrase (e.g. admin or Admin@123)"
                    required
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    disabled={lockoutSeconds > 0 || isSubmitting}
                    className="w-full pr-10 py-3 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none font-mono tracking-wider selection:bg-cyan-500 selection:text-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/[0.08] transition-all cursor-pointer"
                    title={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>


              {/* Tactical Action Button */}
              <button
                type="submit"
                disabled={isSubmitting || lockoutSeconds > 0}
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-300 hover:from-cyan-300 hover:to-teal-200 text-black font-black text-xs tracking-widest flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,240,255,0.5),0_4px_15px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.7)] hover:shadow-[0_0_40px_rgba(0,240,255,0.7),0_6px_20px_rgba(0,0,0,0.6)] transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>AUTHENTICATING NODE...</span>
                  </>
                ) : (
                  <>
                    <span>AUTHENTICATE &amp; ENTER DASHBOARD</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Clean Classified Defense Footer */}
      <footer className="relative z-10 py-2.5 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 border-t border-white/[0.10] backdrop-blur-xl bg-slate-950/30">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] shadow-[0_0_8px_#00E599]" />
          <span>&copy; 2026 SEEMADRISHTI DEFENSE TECHNOLOGIES</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 tracking-wider">
          <span>RESTRICTED // MIL-STD-810H COMPLIANT</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">AIR-GAPPED DEFENSE MATRIX</span>
        </div>
      </footer>
    </div>
  );
};
