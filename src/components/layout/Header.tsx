import React, { useState, useEffect } from 'react';
import {
  Menu,
  RefreshCw,
  Lock,
  Sun,
  Moon,
  Zap,
  Clock,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSecurity } from '../../context/SecurityContext';
import { OperatorProfileDropdown } from '../profile/OperatorProfileDropdown';
import { webSocketService, WebSocketServiceState } from '../../services/websocketService';
import { AiSystemStatusModal } from '../modals/AiSystemStatusModal';
import { SeemadrishtiLogo } from './SeemadrishtiLogo';

interface HeaderProps {
  onToggleSidebarMobile: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  activeAlertCount?: number;
  onOpenDemoMode?: () => void;
  onOpenSettings?: () => void;
  onOpenAlerts?: () => void;
  onOpenSwarmHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebarMobile,
  onRefresh,
  isRefreshing = false,
  activeAlertCount = 12,
  onOpenDemoMode,
  onOpenSettings,
  onOpenAlerts,
  onOpenSwarmHelp,
}) => {
  const { theme, toggleTheme, isDaylight } = useTheme();
  const { user, logout, setPortal, setIsProfileModalOpen } = useAuth();
  const { lockNow } = useSecurity();
  const [dateString, setDateString] = useState('MON, SEP 16, 2026');
  const [timeString, setTimeString] = useState('10:45:22 AM');
  const [utcString, setUtcString] = useState('17:45:22 UTC');
  const [shortDate, setShortDate] = useState('22 Apr 2025');
  const [clock24, setClock24] = useState('14:32:18');
  const [wsState, setWsState] = useState<WebSocketServiceState>(
    webSocketService.getState()
  );
  const [isAiStatusOpen, setIsAiStatusOpen] = useState(false);

  useEffect(() => {
    const unsubWs = webSocketService.onStateChange((st) => setWsState(st));
    return () => {
      unsubWs();
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const dateNum = now.getDate();
      const year = now.getFullYear();
      
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = hours < 10 ? `0${hours}` : hours;
      const minutesStr = now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes();
      const secondsStr = now.getSeconds() < 10 ? `0${now.getSeconds()}` : now.getSeconds();

      const utcHours = String(now.getUTCHours()).padStart(2, '0');
      const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
      const utcSecs = String(now.getUTCSeconds()).padStart(2, '0');

      setDateString(`${dayName}, ${monthName} ${dateNum}, ${year}`);
      setTimeString(`${hoursStr}:${minutesStr}:${secondsStr} ${ampm}`);
      setUtcString(`${utcHours}:${utcMins}:${utcSecs} Z`);

      setShortDate(`${dateNum} ${shortMonths[now.getMonth()]} ${year}`);
      const h24 = String(now.getHours()).padStart(2, '0');
      const m24 = String(now.getMinutes()).padStart(2, '0');
      const s24 = String(now.getSeconds()).padStart(2, '0');
      setClock24(`${h24}:${m24}:${s24}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);



  return (
    <header
      id="executive-header"
      className={`h-16 border-b flex items-center justify-between px-3 sm:px-5 sticky top-0 z-30 transition-all duration-300 backdrop-blur-md ${
        isDaylight
          ? 'bg-white/95 border-slate-300 shadow-sm text-slate-900'
          : 'bg-[#040812]/95 border-slate-800/90 text-slate-200'
      }`}
      style={
        !isDaylight
          ? {
              backgroundImage:
                "linear-gradient(to right, rgba(4, 8, 18, 0.96), rgba(4, 8, 18, 0.75), rgba(4, 8, 18, 0.96)), url('/assets/header_tactical_bg.png')",
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
    >
      {/* Left: Hamburger, Logo, Brand Title & Tagline */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          id="btn-toggle-menu"
          onClick={onToggleSidebarMobile}
          aria-label="Toggle Navigation Menu"
          className={`p-2 rounded-lg border transition-all lg:hidden cursor-pointer ${
            isDaylight
              ? 'text-slate-700 hover:text-black hover:bg-slate-100 border-slate-300'
              : 'text-cyan-400 hover:text-white hover:bg-cyan-950/50 border-cyan-500/20 hover:border-cyan-500/50'
          }`}
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-3">
          <SeemadrishtiLogo size={32} className="hidden xs:inline-flex shrink-0" />
          <div className="flex flex-col">
            <h1
              id="dashboard-title-heading"
              className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-mono leading-none"
            >
              SEEMADRISHTI
            </h1>
            <p className="text-[8px] font-mono tracking-widest text-emerald-400 font-bold uppercase mt-1">
              DEFENSE | SURVEILLANCE | SECURITY
            </p>
          </div>

          <div className="hidden lg:flex flex-col pl-4 border-l border-slate-700/60 leading-tight">
            <span className="text-[11px] font-semibold text-slate-300">
              AI Powered Defense &amp; Security Surveillance System
            </span>
            <span className="text-[10px] text-teal-400 font-mono">
              Smarter Eyes. Safer Tomorrow.
            </span>
          </div>
        </div>
      </div>

      {/* Right: System Status, Live Clock, Theme Toggle & Operator Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* System Online Pill */}
        <button
          id="system-status-pill"
          onClick={() => setIsAiStatusOpen(true)}
          title="Click to inspect real-time AI subsystem integrity & model status"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/50 bg-[#072018]/90 text-emerald-400 font-mono font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
          <span className="tracking-wider">SYSTEM ONLINE</span>
        </button>

        {/* Digital Clock Pill matching reference screenshot */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1 rounded-full border border-slate-700/60 bg-[#081020]/90 text-slate-300">
          <Clock size={16} className="text-slate-400 shrink-0" />
          <div className="text-left font-mono leading-tight">
            <div className="text-[10px] text-slate-400 font-semibold">{shortDate}</div>
            <div className="text-xs font-black text-white tracking-widest leading-none mt-0.5">{clock24}</div>
          </div>
        </div>

        {/* Multi-Agent Swarm Orchestrator Button */}
        {onOpenSwarmHelp && (
          <button
            id="btn-open-swarm-help"
            onClick={onOpenSwarmHelp}
            title="Open Multi-Agent Work Distribution & Task Orchestration Help"
            className={`p-1.5 sm:px-2.5 rounded-lg border flex items-center gap-1.5 font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isDaylight
                ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-300'
                : 'bg-cyan-950/60 hover:bg-cyan-900/80 border-cyan-500/40 text-cyan-300'
            }`}
          >
            <Zap size={13} className="text-cyan-400 animate-pulse" />
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          id="btn-toggle-theme"
          onClick={toggleTheme}
          title={
            isDaylight
              ? 'Switch to Military Matrix Dark Theme'
              : 'Switch to Standard High-Visibility Daylight Field Theme'
          }
          className={`p-2 rounded-lg border flex items-center gap-1.5 font-mono text-xs font-bold transition-all cursor-pointer ${
            isDaylight
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
              : 'bg-[#050b14] hover:bg-cyan-950/60 border-cyan-500/30 text-cyan-300'
          }`}
        >
          {isDaylight ? (
            <Sun size={14} className="text-amber-600 animate-spin-slow" />
          ) : (
            <Moon size={14} className="text-cyan-400" />
          )}
        </button>

        {/* Refresh Data Button */}
        <button
          id="btn-refresh-data"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh All Feeds & Alerts"
          className={`p-2 rounded-lg border transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
            isDaylight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              : 'bg-[#050b14] hover:bg-cyan-950/60 border-cyan-500/30 text-cyan-400 hover:text-white'
          } ${isRefreshing ? 'border-cyan-400 ring-2 ring-cyan-400/50' : ''}`}
        >
          <RefreshCw
            size={14}
            className={`${isRefreshing ? 'animate-spin text-cyan-300' : ''}`}
          />
        </button>

        {/* SAMPLE OF PROFILE SETUP: Right Upper Corner (Matching Reference Design) */}
        {user ? (
          <div className="pl-2 border-l border-slate-700/50">
            <OperatorProfileDropdown
              onOpenSettings={onOpenSettings}
              onOpenAlerts={onOpenAlerts}
            />
          </div>
        ) : (
          <button
            onClick={() => setPortal('auth')}
            className="p-1.5 px-3 rounded-xl border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900 text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Lock size={12} />
            <span>SIGN IN</span>
          </button>
        )}
      </div>

      {/* Real-Time AI Subsystem Status & Integrity Modal */}
      <AiSystemStatusModal
        isOpen={isAiStatusOpen}
        onClose={() => setIsAiStatusOpen(false)}
        wsState={wsState}
      />
    </header>
  );
};
