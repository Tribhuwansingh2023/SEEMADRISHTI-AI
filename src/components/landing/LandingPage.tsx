import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Eye,
  ArrowRight,
  Play,
  X,
  Crosshair,
  BarChart2,
  Video,
  ShieldCheck,
  User,
  Car,
  ScanLine,
  AlertTriangle,
  Layers,
  MapPin,
  Building2,
  Users,
  Compass,
  Cpu,
  Zap,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  Radio,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { SeemadrishtiLogo } from '../layout/SeemadrishtiLogo';
import { HeroDashboard3D } from './HeroDashboard3D';
import { useTheme } from '../../context/ThemeContext';

interface LandingPageProps {
  onEnterAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterAuth }) => {
  const { theme, toggleTheme, isDaylight } = useTheme();
  const [activeNav, setActiveNav] = useState('home');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Smooth scroll helper
  const scrollTo = (id: string) => {
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#02050c] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden relative">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (Sticky Glassmorphic Header)                                 */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#040814]/90 border-b border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Left: Brand Logo & Typography */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => scrollTo('home')}
          >
            <SeemadrishtiLogo size={36} className="group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-wider text-white uppercase font-mono leading-none">
                SEEMADRISHTI
              </span>
              <span className="text-[8px] font-mono tracking-widest text-emerald-400 font-bold uppercase mt-1">
                DEFENSE | SURVEILLANCE | SECURITY
              </span>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-mono font-semibold tracking-wide">
            <button
              onClick={() => scrollTo('home')}
              className={`transition-colors cursor-pointer relative py-1 ${
                activeNav === 'home'
                  ? 'text-[#00E599] font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Home</span>
              {activeNav === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E599] rounded-full shadow-[0_0_8px_#00E599]" />
              )}
            </button>

            <button
              onClick={() => scrollTo('features')}
              className={`transition-colors cursor-pointer relative py-1 ${
                activeNav === 'features'
                  ? 'text-[#00E599] font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Features</span>
              {activeNav === 'features' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E599] rounded-full shadow-[0_0_8px_#00E599]" />
              )}
            </button>

            <button
              onClick={() => scrollTo('use-cases')}
              className={`transition-colors cursor-pointer relative py-1 ${
                activeNav === 'use-cases'
                  ? 'text-[#00E599] font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Use Cases</span>
              {activeNav === 'use-cases' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E599] rounded-full shadow-[0_0_8px_#00E599]" />
              )}
            </button>

            <button
              onClick={() => scrollTo('technology')}
              className={`transition-colors cursor-pointer relative py-1 ${
                activeNav === 'technology'
                  ? 'text-[#00E599] font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Technology</span>
              {activeNav === 'technology' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E599] rounded-full shadow-[0_0_8px_#00E599]" />
              )}
            </button>

            <button
              onClick={() => scrollTo('about')}
              className={`transition-colors cursor-pointer relative py-1 ${
                activeNav === 'about'
                  ? 'text-[#00E599] font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>About</span>
              {activeNav === 'about' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E599] rounded-full shadow-[0_0_8px_#00E599]" />
              )}
            </button>

            <button
              onClick={() => scrollTo('contact')}
              className={`transition-colors cursor-pointer relative py-1 ${
                activeNav === 'contact'
                  ? 'text-[#00E599] font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Contact</span>
              {activeNav === 'contact' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E599] rounded-full shadow-[0_0_8px_#00E599]" />
              )}
            </button>
          </nav>

          {/* Right: Theme Toggle & Get Started CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title="Toggle Color Theme"
              className="p-2 rounded-full border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {isDaylight ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            <button
              onClick={onEnterAuth}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#00E599] to-[#00C48C] hover:from-[#15f5a8] hover:to-[#05d99b] text-black font-mono text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_25px_rgba(0,229,153,0.45)] hover:shadow-[0_0_35px_rgba(0,229,153,0.6)] hover:scale-105 active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight size={14} className="stroke-[3]" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION WITH CINEMATIC DEFENSE LANDSCAPE & 3D DEVICE               */}
      {/* ========================================================================= */}
      <section
        id="home"
        className="relative min-h-[92vh] flex items-center justify-center pt-8 pb-16 overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(2, 5, 12, 0.94) 0%, rgba(2, 5, 12, 0.82) 45%, rgba(2, 5, 12, 0.70) 100%), url('/assets/landing_hero_bg.jpg')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Subtle Ambient Scanline Grid Layer */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/15 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Hero Typography & Actions (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              {/* Category Tag */}
              <div className="inline-flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                  AI POWERED DEFENSE &amp; SECURITY SURVEILLANCE --
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">
                  <span className="text-white">SEEMA</span>
                  <span className="text-[#00E599] drop-shadow-[0_0_25px_rgba(0,229,153,0.45)]">
                    DRISHTI
                  </span>
                </h1>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100 tracking-tight mt-2">
                  See More. Protect Smarter.
                </p>
              </div>

              {/* Value Proposition Description */}
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed font-sans font-normal">
                Advanced AI-powered surveillance system for real-time threat detection, people &amp;
                vehicle tracking, number plate recognition and smarter security management — built
                for a safer tomorrow.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onEnterAuth}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#00E599] hover:bg-[#15f5a8] text-black font-mono text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_30px_rgba(0,229,153,0.5)] hover:shadow-[0_0_40px_rgba(0,229,153,0.7)] hover:scale-105 active:scale-95"
                >
                  <span>Get Started</span>
                  <ArrowRight size={15} className="stroke-[3]" />
                </button>

                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 hover:text-white font-mono text-xs font-bold border border-cyan-500/30 hover:border-cyan-400 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] active:scale-95"
                >
                  <Play size={13} className="text-cyan-400 fill-cyan-400" />
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* 4 Feature Highlights in a Row with Glowing Rings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border border-cyan-400/50 bg-cyan-950/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    <Crosshair size={14} />
                  </div>
                  <span className="text-xs font-mono text-slate-300 font-semibold leading-tight">
                    Real-time Detection
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border border-cyan-400/50 bg-cyan-950/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    <BarChart2 size={14} />
                  </div>
                  <span className="text-xs font-mono text-slate-300 font-semibold leading-tight">
                    AI-Powered Analytics
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border border-cyan-400/50 bg-cyan-950/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    <Video size={14} />
                  </div>
                  <span className="text-xs font-mono text-slate-300 font-semibold leading-tight">
                    Multi-Camera Support
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border border-cyan-400/50 bg-cyan-950/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    <ShieldCheck size={14} />
                  </div>
                  <span className="text-xs font-mono text-slate-300 font-semibold leading-tight">
                    Defense Grade Security
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Holographic Perspective Dashboard Terminal (5 cols) */}
            <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
              <HeroDashboard3D onOpenApp={onEnterAuth} />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. KEY FEATURES SECTION ("Powerful AI. Complete Surveillance.")            */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 bg-[#030712] border-t border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Header Description & Action (3.5 cols) */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                  KEY FEATURES
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                  Powerful AI. Complete Surveillance.
                </h2>
                <p className="text-sm text-slate-400 font-sans leading-relaxed">
                  From real-time detection to intelligent threat analysis, SEEMADRISHTI gives you
                  complete control and situational awareness — anytime, anywhere.
                </p>
              </div>

              <div>
                <button
                  onClick={() => scrollTo('use-cases')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/50 text-cyan-300 font-mono text-xs font-bold transition-all cursor-pointer group shadow-sm"
                >
                  <span>Explore All Features</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Middle Feature Cards Grid (5.5 cols -> 6 cards in 3x2 or 2x3) */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Feature 1 */}
              <div className="p-3.5 rounded-xl border border-slate-800/90 bg-[#060c18] hover:border-cyan-500/40 transition-all flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <User size={15} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white font-mono">
                    People Detection &amp; Tracking
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Detect and track individuals with high accuracy in real-time.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-3.5 rounded-xl border border-slate-800/90 bg-[#060c18] hover:border-cyan-500/40 transition-all flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Car size={15} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white font-mono">
                    Vehicle Detection &amp; Tracking
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Identify and monitor cars, bikes, trucks, buses and more.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-3.5 rounded-xl border border-slate-800/90 bg-[#060c18] hover:border-cyan-500/40 transition-all flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <ScanLine size={15} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white font-mono">
                    Number Plate Recognition
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Extract and recognize license plates using advanced OCR.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-3.5 rounded-xl border border-slate-800/90 bg-[#060c18] hover:border-cyan-500/40 transition-all flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <AlertTriangle size={15} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white font-mono">
                    Suspicious Activity Detection
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Detect loitering, intrusion, crowd and unusual behavior.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="p-3.5 rounded-xl border border-slate-800/90 bg-[#060c18] hover:border-cyan-500/40 transition-all flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={15} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white font-mono">
                    Restricted Zone Monitoring
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Define zones and get instant alerts on violations.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="p-3.5 rounded-xl border border-slate-800/90 bg-[#060c18] hover:border-cyan-500/40 transition-all flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Video size={15} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white font-mono">
                    Multi-Camera Support
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Monitor multiple locations from a single dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Quote / Defense Banner Card (3 cols) */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-800 overflow-hidden relative min-h-[220px] flex flex-col justify-between p-6 shadow-xl">
              {/* Background Soldier Image */}
              <img
                src="/assets/landing_quote_soldier.jpg"
                alt="Smarter Surveillance for a Safer Nation"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

              <div className="relative z-10 text-cyan-400 text-3xl font-serif leading-none">
                “
              </div>

              <div className="relative z-10 space-y-2 mt-auto">
                <h3 className="text-lg font-black text-white font-sans leading-snug tracking-tight">
                  Smarter Surveillance for a Safer Nation
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  Built for Defense. Designed for Security.
                </p>

                {/* Progress Indicator Bar */}
                <div className="w-16 h-1 rounded-full bg-[#00E599] shadow-[0_0_8px_#00E599] mt-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. USE CASES ("Built for Real-World Challenges")                           */}
      {/* ========================================================================= */}
      <section id="use-cases" className="py-16 bg-[#02050c] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
              USE CASES
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Built for Real-World Challenges
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* 4 Use Case Cards (9 cols) */}
            <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Case 1 */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#060c18] hover:border-cyan-500/50 transition-all flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0">
                    <MapPin size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-white font-mono">
                    Border Security
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-2">
                  Monitor borders &amp; prevent intrusion
                </p>
              </div>

              {/* Case 2 */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#060c18] hover:border-cyan-500/50 transition-all flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0">
                    <Building2 size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-white font-mono">
                    Critical Infrastructure
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-2">
                  Protect vital assets &amp; facilities
                </p>
              </div>

              {/* Case 3 */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#060c18] hover:border-cyan-500/50 transition-all flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0">
                    <Users size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-white font-mono">
                    Public Safety
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-2">
                  Ensure safer communities
                </p>
              </div>

              {/* Case 4 */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#060c18] hover:border-cyan-500/50 transition-all flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0">
                    <Compass size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-white font-mono">
                    Military &amp; Defense
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-2">
                  Enhance operational awareness
                </p>
              </div>
            </div>

            {/* Tactical Sonar Radar Widget (3 cols) */}
            <div className="md:col-span-3 rounded-xl border border-slate-800/90 bg-[#050a14] p-3 flex items-center justify-between gap-3 shadow-md">
              {/* Circular Animated Radar Sweep */}
              <div className="relative w-16 h-16 shrink-0 rounded-full border border-emerald-500/40 bg-emerald-950/20 overflow-hidden flex items-center justify-center">
                {/* Concentric rings */}
                <div className="absolute inset-1.5 rounded-full border border-emerald-500/30" />
                <div className="absolute inset-4 rounded-full border border-emerald-500/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />

                {/* Rotating Sweep Beam */}
                <div
                  className="absolute inset-0 origin-center animate-spin"
                  style={{
                    background:
                      'conic-gradient(from 0deg at 50% 50%, rgba(16,185,129,0.5) 0deg, rgba(16,185,129,0) 75deg, transparent 360deg)',
                    animationDuration: '3s',
                  }}
                />

                {/* Blinking Target Dot */}
                <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              </div>

              {/* Tagline */}
              <div className="text-[9px] font-mono text-slate-400 leading-tight">
                <div className="text-emerald-400 font-bold tracking-wider">
                  INTELLIGENCE TODAY.
                </div>
                <div className="text-slate-300 font-bold tracking-wider">
                  SAFETY TOMORROW.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TECHNOLOGY & ARCHITECTURAL STACK                                        */}
      {/* ========================================================================= */}
      <section id="technology" className="py-16 bg-[#030712] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
              TECHNOLOGY STACK
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              State-of-the-Art Edge AI Architecture
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Combining optimized YOLOv8 deep neural inference with homography spatial re-ID and
              cryptographic evidence integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#060c18]">
              <div className="text-3xl font-black text-[#00E599] font-mono leading-none">
                60 FPS
              </div>
              <div className="text-xs font-bold text-white font-mono mt-2 uppercase">
                Real-Time Inference
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Optimized TensorRT &amp; CUDA acceleration with frame buffer control.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-[#060c18]">
              <div className="text-3xl font-black text-cyan-400 font-mono leading-none">
                &lt; 15 ms
              </div>
              <div className="text-xs font-bold text-white font-mono mt-2 uppercase">
                Tripwire Latency
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Zero-delay perimeter breach alert delivery over WebSocket telemetry.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-[#060c18]">
              <div className="text-3xl font-black text-blue-400 font-mono leading-none">
                99.4%
              </div>
              <div className="text-xs font-bold text-white font-mono mt-2 uppercase">
                Re-ID Accuracy
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Ground-plane homography spatial matrix tracking across multi-camera blind zones.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-[#060c18]">
              <div className="text-3xl font-black text-purple-400 font-mono leading-none">
                SHA-256
              </div>
              <div className="text-xs font-bold text-white font-mono mt-2 uppercase">
                Tamper-Proof Audit
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Cryptographic hash chaining for forensic legal chain of custody.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION & FOOTER                                                 */}
      {/* ========================================================================= */}
      <footer id="contact" className="py-12 bg-[#020409] border-t border-slate-800/80 text-slate-400 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/60">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <SeemadrishtiLogo size={32} />
              <div>
                <span className="text-base font-black text-white tracking-wider">
                  SEEMADRISHTI
                </span>
                <div className="text-[8px] text-emerald-400 font-bold tracking-widest uppercase">
                  DEFENSE | SURVEILLANCE | SECURITY
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-6 text-slate-400 text-xs">
              <button onClick={() => scrollTo('home')} className="hover:text-white transition-colors cursor-pointer">
                Home
              </button>
              <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors cursor-pointer">
                Features
              </button>
              <button onClick={() => scrollTo('use-cases')} className="hover:text-white transition-colors cursor-pointer">
                Use Cases
              </button>
              <button onClick={() => scrollTo('technology')} className="hover:text-white transition-colors cursor-pointer">
                Technology
              </button>
              <button onClick={onEnterAuth} className="text-[#00E599] font-bold hover:underline cursor-pointer">
                Launch Portal →
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>
              &copy; {new Date().getFullYear()} SEEMADRISHTI. AI Powered Defense &amp; Security Surveillance System.
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <span className="w-2.5 h-1.5 bg-[#FF9933] rounded-xs" />
                <span className="w-2.5 h-1.5 bg-[#FFFFFF] rounded-xs" />
                <span className="w-2.5 h-1.5 bg-[#128807] rounded-xs" />
              </div>
              <span className="text-slate-300 font-semibold tracking-wide">
                Built for a Safer Nation
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 7. WATCH DEMO VIDEO BRIEFING MODAL                                         */}
      {/* ========================================================================= */}
      {isDemoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsDemoModalOpen(false)}
        >
          <div
            className="max-w-4xl w-full rounded-2xl bg-[#070e1c] border border-cyan-500/40 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Play size={16} className="text-cyan-400 fill-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  SEEMADRISHTI Tactical Surveillance Demo
                </h3>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-black aspect-video relative">
              <video
                src="/fixtures/visdrone/CAM-01.mp4"
                autoPlay
                controls
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('moving_objects.mp4')) {
                    target.src = '/fixtures/moving_objects.mp4';
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
              <span>Feed: CAM-01 (Main Gate Entrance)</span>
              <span>Model: YOLOv8s + ByteTrack</span>
              <button
                onClick={() => {
                  setIsDemoModalOpen(false);
                  onEnterAuth();
                }}
                className="px-3 py-1 rounded bg-[#00E599] text-black font-bold uppercase text-[11px] hover:bg-[#15f5a8] transition-all cursor-pointer"
              >
                Launch Live App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
