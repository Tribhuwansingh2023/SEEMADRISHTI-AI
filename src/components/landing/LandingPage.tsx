import React, { useState, useEffect } from 'react';
import {
  Shield,
  ArrowRight,
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
  Sparkles,
  Server,
  Activity,
  Anchor,
  Plane,
  Network,
  ChevronRight,
  Terminal,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { SeemadrishtiLogo } from '../layout/SeemadrishtiLogo';
import { HeroDashboard3D } from './HeroDashboard3D';

interface LandingPageProps {
  onEnterAuth: () => void;
  initialSection?: string;
  onNavigateSection?: (section: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterAuth,
  initialSection = 'home',
  onNavigateSection,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialSection);

  // Synchronize state when initialSection prop updates (e.g. browser back/forward or URL change)
  useEffect(() => {
    if (initialSection) {
      setActiveTab(initialSection);
    }
  }, [initialSection]);

  // Robust scroll to top whenever activeTab changes
  useEffect(() => {
    try {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {}
  }, [activeTab]);

  // Tab switcher with instant scroll to top of view
  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    try {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {}
    if (onNavigateSection) {
      onNavigateSection(tab);
    }
  };

  return (
    <div className="min-h-screen bg-[#040817] text-slate-100 font-sans selection:bg-[#00E599] selection:text-black overflow-x-hidden relative flex flex-col justify-between">
      {/* ========================================================================= */}
      {/* GLOBAL CONTINUOUS BACKGROUND SYSTEM (Unified Theme Across ALL Sections)  */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Ambient Top Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -right-32 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/6 rounded-full blur-[150px]" />
        
        {/* Continuous Tactical Cyber Dot & Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(0, 229, 153, 0.45) 1px, transparent 1px), radial-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px)',
            backgroundSize: '36px 36px, 12px 12px',
          }}
        />

        {/* Global Cinematic Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(4,8,23,0.75)_100%)]" />
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (Sticky Glassmorphic Header - Tactical Defense Theme)        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#040817]/90 border-b border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Left: Brand Logo & Typography */}
          <button
            onClick={() => handleSelectTab('home')}
            className="flex items-center gap-3 cursor-pointer group text-left focus:outline-none"
          >
            <SeemadrishtiLogo size={36} className="group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-wider text-white uppercase font-mono leading-none">
                SEEMADRISHTI
              </span>
              <span className="text-[8px] font-mono tracking-widest text-[#00E599] font-bold uppercase mt-1">
                DEFENSE | SURVEILLANCE | SECURITY
              </span>
            </div>
          </button>

          {/* Center: Navigation Links (Home, Features, Use Cases, Technology, About) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-mono font-semibold tracking-wide">
            <button
              onClick={() => handleSelectTab('home')}
              className={`transition-all duration-200 cursor-pointer relative py-2 focus:outline-none ${
                activeTab === 'home'
                  ? 'text-[#00E599] font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Home</span>
              {activeTab === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E599] rounded-full shadow-[0_0_10px_#00E599]" />
              )}
            </button>

            <button
              onClick={() => handleSelectTab('features')}
              className={`transition-all duration-200 cursor-pointer relative py-2 focus:outline-none ${
                activeTab === 'features'
                  ? 'text-[#00E599] font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Features</span>
              {activeTab === 'features' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E599] rounded-full shadow-[0_0_10px_#00E599]" />
              )}
            </button>

            <button
              onClick={() => handleSelectTab('use-cases')}
              className={`transition-all duration-200 cursor-pointer relative py-2 focus:outline-none ${
                activeTab === 'use-cases'
                  ? 'text-[#00E599] font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Use Cases</span>
              {activeTab === 'use-cases' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E599] rounded-full shadow-[0_0_10px_#00E599]" />
              )}
            </button>

            <button
              onClick={() => handleSelectTab('technology')}
              className={`transition-all duration-200 cursor-pointer relative py-2 focus:outline-none ${
                activeTab === 'technology'
                  ? 'text-[#00E599] font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Technology</span>
              {activeTab === 'technology' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E599] rounded-full shadow-[0_0_10px_#00E599]" />
              )}
            </button>

            <button
              onClick={() => handleSelectTab('about')}
              className={`transition-all duration-200 cursor-pointer relative py-2 focus:outline-none ${
                activeTab === 'about'
                  ? 'text-[#00E599] font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>About</span>
              {activeTab === 'about' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E599] rounded-full shadow-[0_0_10px_#00E599]" />
              )}
            </button>
          </nav>

          {/* Right: Primary "Get Access" CTA Button */}
          <div className="flex items-center gap-3">
            <button
              id="landing-navbar-get-access"
              onClick={onEnterAuth}
              className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-[#00E599] via-[#00f0aa] to-[#00C48C] hover:from-[#15f5a8] hover:to-[#05d99b] text-black font-mono text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_25px_rgba(0,229,153,0.45)] hover:shadow-[0_0_35px_rgba(0,229,153,0.65)] hover:scale-105 active:scale-95"
            >
              <span>Get Access</span>
              <ArrowRight size={14} className="stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-[#040817]/95 px-2 py-2 text-[11px] font-mono">
          <button
            onClick={() => handleSelectTab('home')}
            className={`py-1.5 px-2.5 rounded-lg transition-all ${
              activeTab === 'home' ? 'text-[#00E599] font-bold bg-[#00E599]/15' : 'text-slate-400'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleSelectTab('features')}
            className={`py-1.5 px-2.5 rounded-lg transition-all ${
              activeTab === 'features' ? 'text-[#00E599] font-bold bg-[#00E599]/15' : 'text-slate-400'
            }`}
          >
            Features
          </button>
          <button
            onClick={() => handleSelectTab('use-cases')}
            className={`py-1.5 px-2 rounded-lg transition-all ${
              activeTab === 'use-cases' ? 'text-[#00E599] font-bold bg-[#00E599]/15' : 'text-slate-400'
            }`}
          >
            Use Cases
          </button>
          <button
            onClick={() => handleSelectTab('technology')}
            className={`py-1.5 px-2 rounded-lg transition-all ${
              activeTab === 'technology' ? 'text-[#00E599] font-bold bg-[#00E599]/15' : 'text-slate-400'
            }`}
          >
            Tech
          </button>
          <button
            onClick={() => handleSelectTab('about')}
            className={`py-1.5 px-2 rounded-lg transition-all ${
              activeTab === 'about' ? 'text-[#00E599] font-bold bg-[#00E599]/15' : 'text-slate-400'
            }`}
          >
            About
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. DEDICATED VIEW ROUTER (Home, Features, Use Cases, Technology, About)     */}
      {/* ========================================================================= */}
      <main className="flex-1 relative z-10">
        {activeTab === 'home' && <HomeView onEnterAuth={onEnterAuth} onSelectTab={handleSelectTab} />}
        {activeTab === 'features' && <FeaturesView onEnterAuth={onEnterAuth} />}
        {activeTab === 'use-cases' && <UseCasesView onEnterAuth={onEnterAuth} />}
        {activeTab === 'technology' && <TechnologyView onEnterAuth={onEnterAuth} />}
        {activeTab === 'about' && <AboutView onEnterAuth={onEnterAuth} />}
      </main>

      {/* ========================================================================= */}
      {/* 3. CALL TO ACTION BANNER (Enclosed Tactical Glass Panel on Unified Theme) */}
      {/* ========================================================================= */}
      <section className="py-20 relative z-10 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 border border-emerald-500/30 bg-[#071126]/85 backdrop-blur-xl shadow-[0_0_50px_rgba(0,229,153,0.12)] text-center overflow-hidden">
            {/* Ambient Corner Flare */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Ready to Deploy Real-Time Tactical Surveillance?
              </h2>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed">
                Gain immediate command over live CCTV feeds, AI edge analytics, multi-camera tracking, and verified intrusion alerts.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  id="landing-bottom-get-access"
                  onClick={onEnterAuth}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-[#00E599] via-[#00f0aa] to-[#00C48C] hover:from-[#15f5a8] hover:to-[#05d99b] text-black font-mono text-sm font-black tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_35px_rgba(0,229,153,0.55)] hover:shadow-[0_0_50px_rgba(0,229,153,0.8)] hover:scale-105 active:scale-95"
                >
                  <span>Get Access Now</span>
                  <ArrowRight size={18} className="stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FOOTER (Matching Unified Dark Theme & Border Hierarchy)                */}
      {/* ========================================================================= */}
      <footer className="py-12 relative z-10 border-t border-slate-800/80 text-slate-400 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/60">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <SeemadrishtiLogo size={32} />
              <div>
                <span className="text-base font-black text-white tracking-wider">
                  SEEMADRISHTI
                </span>
                <div className="text-[8px] text-[#00E599] font-bold tracking-widest uppercase">
                  DEFENSE | SURVEILLANCE | SECURITY
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs">
              <button
                onClick={() => handleSelectTab('home')}
                className={`hover:text-white transition-colors cursor-pointer ${
                  activeTab === 'home' ? 'text-[#00E599] font-bold' : ''
                }`}
              >
                Home
              </button>
              <button
                onClick={() => handleSelectTab('features')}
                className={`hover:text-white transition-colors cursor-pointer ${
                  activeTab === 'features' ? 'text-[#00E599] font-bold' : ''
                }`}
              >
                Features
              </button>
              <button
                onClick={() => handleSelectTab('use-cases')}
                className={`hover:text-white transition-colors cursor-pointer ${
                  activeTab === 'use-cases' ? 'text-[#00E599] font-bold' : ''
                }`}
              >
                Use Cases
              </button>
              <button
                onClick={() => handleSelectTab('technology')}
                className={`hover:text-white transition-colors cursor-pointer ${
                  activeTab === 'technology' ? 'text-[#00E599] font-bold' : ''
                }`}
              >
                Technology
              </button>
              <button
                onClick={() => handleSelectTab('about')}
                className={`hover:text-white transition-colors cursor-pointer ${
                  activeTab === 'about' ? 'text-[#00E599] font-bold' : ''
                }`}
              >
                About
              </button>
              <button
                onClick={onEnterAuth}
                className="text-[#00E599] font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Get Access</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>
              &copy; {new Date().getFullYear()} SEEMADRISHTI. AI Powered Defense &amp; Security Surveillance System.
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <span className="w-2.5 h-1.5 bg-[#FF9933] rounded-xs shadow-[0_0_4px_rgba(255,153,51,0.6)]" />
                <span className="w-2.5 h-1.5 bg-[#FFFFFF] rounded-xs shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
                <span className="w-2.5 h-1.5 bg-[#128807] rounded-xs shadow-[0_0_4px_rgba(18,136,7,0.6)]" />
              </div>
              <span className="text-slate-300 font-semibold tracking-wide">
                Built for a Safer Nation
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ========================================================================= */
/* VIEW 1: HOME VIEW (Grand Hero Showcase + 3D Holographic Device Terminal)  */
/* ========================================================================= */
const HomeView: React.FC<{ onEnterAuth: () => void; onSelectTab: (tab: string) => void }> = ({
  onEnterAuth,
  onSelectTab,
}) => {
  return (
    <div className="w-full">
      {/* Hero Showcase with Seamless Blended Background Image */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-10 pb-20 overflow-hidden">
        {/* Softly Blended Backdrop Layer: Smoothly Dissolves into Unified Canvas */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none mix-blend-luminosity"
          style={{
            backgroundImage: "url('/assets/landing_hero_bg.jpg')",
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            maskImage:
              'radial-gradient(ellipse at 65% 35%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 80%), linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at 65% 35%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 80%), linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Hero Headline & Actions */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <div className="inline-flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                  AI POWERED DEFENSE &amp; SECURITY SURVEILLANCE --
                </span>
              </div>

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

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed font-sans font-normal">
                Advanced AI-powered surveillance system for real-time threat detection, people &amp;
                vehicle tracking, number plate recognition and smarter security management — built
                for a safer tomorrow.
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  id="landing-hero-get-access"
                  onClick={onEnterAuth}
                  className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#00E599] via-[#00f0aa] to-[#00C48C] hover:from-[#15f5a8] hover:to-[#05d99b] text-black font-mono text-sm font-black tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_35px_rgba(0,229,153,0.55)] hover:shadow-[0_0_45px_rgba(0,229,153,0.75)] hover:scale-105 active:scale-95"
                >
                  <span>Get Access</span>
                  <ArrowRight size={16} className="stroke-[3]" />
                </button>

                <button
                  onClick={() => onSelectTab('features')}
                  className="flex items-center gap-2 px-6 py-4 rounded-full border border-slate-700 hover:border-[#00E599]/60 bg-[#071126]/80 hover:bg-[#0c1936] text-slate-200 font-mono text-xs font-bold uppercase transition-all duration-200 cursor-pointer backdrop-blur-md shadow-sm"
                >
                  <span>Explore Features</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* 4 Feature Highlights in a Row */}
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

            {/* Right Column: 3D Holographic Perspective Dashboard Terminal */}
            <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
              <HeroDashboard3D />
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars Showcase (Unified Tactical Glassmorphism Cards) */}
      <section className="py-20 border-t border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#00E599]">
              TACTICAL ADVANTAGES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              Engineered for Complete Situational Dominance
            </h2>
            <p className="text-sm text-slate-300 mt-3 font-sans">
              Designed from the ground up to replace fragmented legacy NVR surveillance with zero-delay edge neural inference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-7 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-cyan-500/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-4 group relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Cpu size={24} />
              </div>
              <h3 className="text-lg font-bold text-white font-mono">100% Autonomous Edge AI</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Operates without external internet or cloud latency. All neural detections, bounding boxes, and alerts run locally on edge hardware.
              </p>
              <button
                onClick={() => onSelectTab('technology')}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold hover:underline cursor-pointer"
              >
                <span>Read Technology Spec</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-[#00E599]/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(0,229,153,0.15)] space-y-4 group relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00E599]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#00E599] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers size={24} />
              </div>
              <h3 className="text-lg font-bold text-white font-mono">Homography Multi-Cam Fusion</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Maintains target identity across non-overlapping blind spots using ground-plane homography transformation matrices.
              </p>
              <button
                onClick={() => onSelectTab('features')}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#00E599] font-bold hover:underline cursor-pointer"
              >
                <span>Explore Features</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-purple-500/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] space-y-4 group relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-white font-mono">Forensic Chain of Custody</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Every breach alert and snapshot is sealed with immutable cryptographic signatures, providing unalterable evidentiary proof.
              </p>
              <button
                onClick={() => onSelectTab('about')}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-purple-400 font-bold hover:underline cursor-pointer"
              >
                <span>Learn About Seemadrishti</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ========================================================================= */
/* VIEW 2: FEATURES VIEW (Dedicated Deep-Dive Capabilities Page)             */
/* ========================================================================= */
const FeaturesView: React.FC<{ onEnterAuth: () => void }> = ({ onEnterAuth }) => {
  return (
    <div className="w-full min-h-[85vh] pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Tactical Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Powerful AI. Complete Surveillance.
        </h1>
        <p className="text-base text-slate-300 font-sans leading-relaxed">
          From real-time sub-millisecond detection to automated threat telemetry, SEEMADRISHTI provides tactical commanders and security personnel with end-to-end operational awareness.
        </p>
      </div>

      {/* Main 6 Feature Grids (Standardized Tactical Glass Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Feature 1 */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-cyan-500/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <User size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">ENGINE 01</span>
            <h3 className="text-lg font-bold text-white font-mono mt-0.5">People Detection &amp; Re-ID</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Identifies persons with high-precision bounding boxes. Tracks spatial trajectories across cameras using homography mapping and appearance embeddings.
          </p>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span>Accuracy: <strong className="text-emerald-400">99.4%</strong></span>
            <span>Speed: <strong className="text-cyan-400">&lt; 14ms</strong></span>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-cyan-500/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Car size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">ENGINE 02</span>
            <h3 className="text-lg font-bold text-white font-mono mt-0.5">Vehicle Classification &amp; Speed</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Monitors cars, heavy trucks, buses, military convoys, and motorcycles with automated velocity estimation and direction-of-travel tracking.
          </p>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span>Classes: <strong className="text-emerald-400">8 Categories</strong></span>
            <span>Velocity: <strong className="text-cyan-400">± 1.5 km/h</strong></span>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-cyan-500/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ScanLine size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">ENGINE 03</span>
            <h3 className="text-lg font-bold text-white font-mono mt-0.5">ANPR / License Plate OCR</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Extracts license plates instantly in daylight, nighttime, and adverse weather. Automated blacklist cross-checking with instant alert trigger.
          </p>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span>Extraction: <strong className="text-emerald-400">Sub-second</strong></span>
            <span>OCR Rate: <strong className="text-cyan-400">98.7%</strong></span>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-[#00E599]/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(0,229,153,0.15)] space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00E599]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#00E599] flex items-center justify-center group-hover:scale-105 transition-transform">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E599] font-bold">ENGINE 04</span>
            <h3 className="text-lg font-bold text-white font-mono mt-0.5">Suspicious Anomaly &amp; Loitering</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Temporal analysis flags perimeter loitering, crowd surges, abandoned luggage, and erratic behavior without requiring manual human observation.
          </p>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span>Dwell Timer: <strong className="text-emerald-400">Customizable</strong></span>
            <span>False Positives: <strong className="text-cyan-400">&lt; 0.2%</strong></span>
          </div>
        </div>

        {/* Feature 5 */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-[#00E599]/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(0,229,153,0.15)] space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00E599]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#00E599] flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E599] font-bold">ENGINE 05</span>
            <h3 className="text-lg font-bold text-white font-mono mt-0.5">Directional Virtual Tripwires</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Draw polygonal zones and directional tripwires. Instant WebSocket telemetry dispatches audio alarms and siren protocols within 15ms.
          </p>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span>Alert Latency: <strong className="text-emerald-400">&lt; 15ms</strong></span>
            <span>Zones: <strong className="text-cyan-400">Unlimited</strong></span>
          </div>
        </div>

        {/* Feature 6 */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-[#00E599]/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(0,229,153,0.15)] space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00E599]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#00E599] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Video size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E599] font-bold">ENGINE 06</span>
            <h3 className="text-lg font-bold text-white font-mono mt-0.5">Multi-Camera Spatial Grid</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Centralized monitoring terminal supporting multi-stream feeds, live camera PTZ handoff, quad-stream views, and radar GIS coordinates.
          </p>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span>Concurrent Feeds: <strong className="text-emerald-400">Up to 32</strong></span>
            <span>Protocol: <strong className="text-cyan-400">RTSP / WebRTC</strong></span>
          </div>
        </div>
      </div>

      {/* Technical Feature Matrix (Standardized Glass Container) */}
      <div className="p-8 rounded-2xl border border-slate-800/90 bg-[#071126]/75 backdrop-blur-md shadow-xl space-y-6">
        <h3 className="text-xl font-bold text-white font-mono">
          Technical Specifications &amp; Operational Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl border border-slate-800/80 bg-[#050c1e]/90">
            <div className="text-slate-400 uppercase text-[10px]">Perception Engine</div>
            <div className="text-base font-bold text-[#00E599] mt-1">Autonomous Vision Core</div>
            <div className="text-slate-400 mt-1">Hardware accelerated</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800/80 bg-[#050c1e]/90">
            <div className="text-slate-400 uppercase text-[10px]">Spatial Tracking</div>
            <div className="text-base font-bold text-cyan-400 mt-1">Multi-Target Predictor</div>
            <div className="text-slate-400 mt-1">Ground-plane spatial mapping</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800/80 bg-[#050c1e]/90">
            <div className="text-slate-400 uppercase text-[10px]">Evidence Integrity</div>
            <div className="text-base font-bold text-purple-400 mt-1">Tamper-Proof Ledger</div>
            <div className="text-slate-400 mt-1">Forensic chain of custody</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800/80 bg-[#050c1e]/90">
            <div className="text-slate-400 uppercase text-[10px]">Telemetry Bus</div>
            <div className="text-base font-bold text-amber-400 mt-1">Real-Time Event Stream</div>
            <div className="text-slate-400 mt-1">Sub-15ms broadcast latency</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* VIEW 3: USE CASES VIEW (Dedicated Real-World Deployment Scenarios Page)   */
/* ========================================================================= */
const UseCasesView: React.FC<{ onEnterAuth: () => void }> = ({ onEnterAuth }) => {
  return (
    <div className="w-full min-h-[85vh] pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Tactical Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Built for Real-World Challenges
        </h1>
        <p className="text-base text-slate-300 font-sans leading-relaxed">
          Tested and engineered for high-threat defense perimeters, critical national infrastructure, and mission-critical civil installations.
        </p>
      </div>

      {/* 6 Comprehensive Use Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Use Case 1: Border Security */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-teal-500/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(20,184,166,0.15)] flex flex-col justify-between space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MapPin size={22} />
            </div>
            <h3 className="text-lg font-bold text-white font-mono">
              Border &amp; Line of Control Defense
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Provides forward observation posts with zero blind-spot boundary surveillance. Integrates thermal and optical CCTV feeds to detect human infiltrators, covert crawls, and perimeter fence cutting in extreme weather conditions.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-teal-400 font-bold flex items-center justify-between">
            <span>Threat Response: &lt; 2 Sec</span>
            <span>Night-Vision Ready</span>
          </div>
        </div>

        {/* Use Case 2: Critical Infrastructure */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-teal-500/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(20,184,166,0.15)] flex flex-col justify-between space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 size={22} />
            </div>
            <h3 className="text-lg font-bold text-white font-mono">
              Critical Infrastructure &amp; Power Grids
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Protects electrical substations, nuclear reactors, oil refineries, and defense depots. Automated virtual tripwires identify unauthorized approach vectors before physical security barriers are compromised.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-teal-400 font-bold flex items-center justify-between">
            <span>Perimeter Tripwires</span>
            <span>Zero False Alarms</span>
          </div>
        </div>

        {/* Use Case 3: Public Safety & Smart Cities */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-teal-500/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(20,184,166,0.15)] flex flex-col justify-between space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users size={22} />
            </div>
            <h3 className="text-lg font-bold text-white font-mono">
              Public Safety &amp; Urban Grid Monitoring
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Enables police command centers to maintain crowd safety, track suspects across city blocks using homography re-ID, and instantly flag suspicious loitering or unattended bags in transport hubs.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-teal-400 font-bold flex items-center justify-between">
            <span>Crowd Density Analytics</span>
            <span>Citywide Re-ID</span>
          </div>
        </div>

        {/* Use Case 4: Military Forward Operating Bases */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-teal-500/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(20,184,166,0.15)] flex flex-col justify-between space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Shield size={22} />
            </div>
            <h3 className="text-lg font-bold text-white font-mono">
              Military &amp; Defense Installations
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Automates gate access with high-speed ANPR, monitors ammo depots with intrusion tripwires, and connects directly into base commander tactical displays with customizable DEFCON escalation.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-teal-400 font-bold flex items-center justify-between">
            <span>DEFCON Protocols</span>
            <span>Gate OCR</span>
          </div>
        </div>

        {/* Use Case 5: Coastal & Maritime Ports */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-teal-500/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(20,184,166,0.15)] flex flex-col justify-between space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Anchor size={22} />
            </div>
            <h3 className="text-lg font-bold text-white font-mono">
              Naval Ports &amp; Coastal Borders
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Monitors shorelines, naval docks, and harbor entrances against unauthorized skiffs, nighttime landings, and smuggling vessels with long-range PTZ camera telemetry.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-teal-400 font-bold flex items-center justify-between">
            <span>Vessel Detection</span>
            <span>Harbor Boundary Fencing</span>
          </div>
        </div>

        {/* Use Case 6: Counter-UAS Visual Alerting */}
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-teal-500/60 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-[0_0_25px_rgba(20,184,166,0.15)] flex flex-col justify-between space-y-4 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plane size={22} />
            </div>
            <h3 className="text-lg font-bold text-white font-mono">
              Counter-UAS &amp; Low-Altitude Drone Spotting
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Provides optical confirmation of micro-UAVs and hostile aerial drones approaching perimeter airspaces, dispatching instant radar coordinate packets to defense command.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-teal-400 font-bold flex items-center justify-between">
            <span>Drone Classification</span>
            <span>Sub-Second Flagging</span>
          </div>
        </div>
      </div>

      {/* Live Tactical Sonar Widget Banner (Unified Glass Container) */}
      <div className="rounded-2xl border border-emerald-500/30 bg-[#071126]/85 p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0 rounded-full border-2 border-emerald-500/40 bg-emerald-950/20 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-2 rounded-full border border-emerald-500/30" />
            <div className="absolute inset-5 rounded-full border border-emerald-500/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />

            <div
              className="absolute inset-0 origin-center animate-spin"
              style={{
                background:
                  'conic-gradient(from 0deg at 50% 50%, rgba(16,185,129,0.5) 0deg, rgba(16,185,129,0) 75deg, transparent 360deg)',
                animationDuration: '3s',
              }}
            />

            <div className="absolute top-4 right-5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-[#00E599] uppercase tracking-widest">
              ACTIVE SECTOR MONITORING
            </span>
            <h4 className="text-xl font-bold text-white font-mono">
              Continuous Sonar &amp; Radar GIS Synchronisation
            </h4>
            <p className="text-xs text-slate-300 max-w-xl font-sans">
              SEEMADRISHTI overlays detected targets onto GIS coordinate maps in real time, synchronizing camera coordinates with operational map sectors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* VIEW 4: TECHNOLOGY VIEW (Dedicated Architecture & Benchmark Page)         */
/* ========================================================================= */
const TechnologyView: React.FC<{ onEnterAuth: () => void }> = ({ onEnterAuth }) => {
  return (
    <div className="w-full min-h-[85vh] pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Tactical Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          State-of-the-Art Edge AI Architecture
        </h1>
        <p className="text-base text-slate-300 font-sans leading-relaxed">
          Combining high-speed edge neural vision inference with spatial multi-camera re-ID, hardware acceleration, and tamper-proof evidence integrity.
        </p>
      </div>

      {/* 4 Grand Benchmark Metrics (Unified Glass Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-[#00E599]/60 transition-all duration-300 backdrop-blur-md shadow-lg text-center space-y-2 group">
          <div className="text-4xl sm:text-5xl font-black text-[#00E599] font-mono leading-none group-hover:scale-105 transition-transform">
            60 FPS
          </div>
          <div className="text-sm font-bold text-white font-mono uppercase tracking-wider pt-2">
            Real-Time Inference
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Optimized high-throughput edge acceleration with hardware frame buffer control.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-cyan-500/60 transition-all duration-300 backdrop-blur-md shadow-lg text-center space-y-2 group">
          <div className="text-4xl sm:text-5xl font-black text-cyan-400 font-mono leading-none group-hover:scale-105 transition-transform">
            &lt; 15 ms
          </div>
          <div className="text-sm font-bold text-white font-mono uppercase tracking-wider pt-2">
            Tripwire Latency
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Zero-delay perimeter breach alert delivery over tactical event bus.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-blue-500/60 transition-all duration-300 backdrop-blur-md shadow-lg text-center space-y-2 group">
          <div className="text-4xl sm:text-5xl font-black text-blue-400 font-mono leading-none group-hover:scale-105 transition-transform">
            99.4%
          </div>
          <div className="text-sm font-bold text-white font-mono uppercase tracking-wider pt-2">
            Re-ID Accuracy
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Advanced ground-plane spatial tracking across multi-camera blind zones.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-purple-500/60 transition-all duration-300 backdrop-blur-md shadow-lg text-center space-y-2 group">
          <div className="text-4xl sm:text-5xl font-black text-purple-400 font-mono leading-none group-hover:scale-105 transition-transform">
            Tamper-Proof
          </div>
          <div className="text-sm font-bold text-white font-mono uppercase tracking-wider pt-2">
            Forensic Audit
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Cryptographically sealed audit records for legal chain of custody and incident audits.
          </p>
        </div>
      </div>

      {/* 5-Step Deep Neural Pipeline Breakdown (Unified Glass Container) */}
      <div className="p-8 rounded-2xl border border-slate-800/90 bg-[#071126]/75 backdrop-blur-md shadow-xl space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            DATA PIPELINE
          </span>
          <h3 className="text-2xl font-black text-white font-mono">
            End-to-End Edge Neural Inference Flow
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl font-sans">
            How frames travel from CCTV optical lenses to verified defense alerts in under 15 milliseconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-slate-800/80 bg-[#050c1e]/90 space-y-2">
            <span className="text-xs font-mono font-bold text-cyan-400">01. INGESTION</span>
            <h4 className="text-sm font-bold text-white font-mono">Stream Ingestion</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Zero-copy memory ingestion from camera feeds bypassing processing bottlenecks.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800/80 bg-[#050c1e]/90 space-y-2">
            <span className="text-xs font-mono font-bold text-[#00E599]">02. INFERENCE</span>
            <h4 className="text-sm font-bold text-white font-mono">Neural Engine</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              High-speed neural vision detecting persons, vehicles, license plates, and perimeter threats.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800/80 bg-[#050c1e]/90 space-y-2">
            <span className="text-xs font-mono font-bold text-blue-400">03. TRACKING</span>
            <h4 className="text-sm font-bold text-white font-mono">Spatial Tracking Matrix</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Autonomous spatial persistence mapped into ground coordinates across cameras.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800/80 bg-[#050c1e]/90 space-y-2">
            <span className="text-xs font-mono font-bold text-amber-400">04. RULES ENGINE</span>
            <h4 className="text-sm font-bold text-white font-mono">Tripwire Breach</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Vector intersection testing triggering audio sirens, strobe alerts, and DEFCON changes.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800/80 bg-[#050c1e]/90 space-y-2">
            <span className="text-xs font-mono font-bold text-purple-400">05. AUDIT VAULT</span>
            <h4 className="text-sm font-bold text-white font-mono">Evidence Vault</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Evidence snapshot hashing and chain-of-custody logging into local forensic vault.
            </p>
          </div>
        </div>
      </div>

      {/* Hardware Matrix (Unified Glass Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 backdrop-blur-md shadow-lg space-y-4">
          <div className="flex items-center gap-3">
            <Server className="text-cyan-400" size={24} />
            <h3 className="text-lg font-bold text-white font-mono">Deployment Hardware Support</h3>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050c1e]/90 border border-slate-800/80">
              <span>Tactical Edge Processing Units</span>
              <span className="text-emerald-400 font-bold">Recommended Edge</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050c1e]/90 border border-slate-800/80">
              <span>Command Operations Workstations</span>
              <span className="text-cyan-400 font-bold">Base Command</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050c1e]/90 border border-slate-800/80">
              <span>Hardened Tactical Outpost NVR</span>
              <span className="text-slate-300 font-bold">Supported</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050c1e]/90 border border-slate-800/80">
              <span>Integrated Failover Processing Node</span>
              <span className="text-amber-400 font-bold">Failover Mode</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 backdrop-blur-md shadow-lg space-y-4">
          <div className="flex items-center gap-3">
            <Network className="text-[#00E599]" size={24} />
            <h3 className="text-lg font-bold text-white font-mono">Security &amp; Protocols</h3>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050c1e]/90 border border-slate-800/80">
              <span>Air-Gapped Operation</span>
              <span className="text-emerald-400 font-bold">100% Offline Capable</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050c1e]/90 border border-slate-800/80">
              <span>Encrypted Telemetry Channel</span>
              <span className="text-cyan-400 font-bold">Secure Transport</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050c1e]/90 border border-slate-800/80">
              <span>Role-Based Operator Access</span>
              <span className="text-purple-400 font-bold">Multi-Level Clearance</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050c1e]/90 border border-slate-800/80">
              <span>Standard Video Feed Ingestion</span>
              <span className="text-slate-300 font-bold">Universal Compatibility</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* VIEW 5: ABOUT VIEW (Dedicated Sovereign Defense Mission Page)             */
/* ========================================================================= */
const AboutView: React.FC<{ onEnterAuth: () => void }> = ({ onEnterAuth }) => {
  return (
    <div className="w-full min-h-[85vh] pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Tactical Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Next-Generation Defense Intelligence &amp; Border Surveillance
        </h1>
        <p className="text-base text-slate-300 font-sans leading-relaxed">
          SEEMADRISHTI was conceived to address modern national security and high-stakes perimeter protection challenges with indigenous, sovereign AI.
        </p>
      </div>

      {/* Mission Deep-Dive Full Width */}
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sovereign Edge Computing Built for Defense
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-3xl mx-auto">
            SEEMADRISHTI bridges disparate CCTV video streams, thermal imaging systems, and autonomous sensors into a unified, zero-latency situational command matrix. Conceived with an uncompromising defense-first mindset, our edge software operates completely disconnected from external internet clouds to ensure absolute operational secrecy and data sovereignty.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed font-sans max-w-3xl mx-auto">
            Whether deployed at high-altitude forward defense posts along national borders, critical energy grids, naval dockyards, or urban police command networks, SEEMADRISHTI turns standard optical and thermal video streams into actionable threat intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-cyan-500/60 transition-all duration-300 backdrop-blur-md shadow-lg space-y-2 text-center group">
            <div className="text-cyan-400 font-black text-3xl font-mono group-hover:scale-105 transition-transform">100%</div>
            <div className="text-sm font-bold text-white font-mono mt-1">Autonomous</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">Real-time edge processing without external network dependencies.</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-[#00E599]/60 transition-all duration-300 backdrop-blur-md shadow-lg space-y-2 text-center group">
            <div className="text-[#00E599] font-black text-3xl font-mono group-hover:scale-105 transition-transform">256-Bit</div>
            <div className="text-sm font-bold text-white font-mono mt-1">Defense Grade</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">Hardware-enforced security with verifiable forensic audit logs.</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/90 bg-[#071126]/75 hover:bg-[#0b1836]/85 hover:border-purple-500/60 transition-all duration-300 backdrop-blur-md shadow-lg space-y-2 text-center group">
            <div className="text-purple-400 font-black text-3xl font-mono group-hover:scale-105 transition-transform">24/7/365</div>
            <div className="text-sm font-bold text-white font-mono mt-1">High Availability</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">Fault-tolerant failover with continuous telemetry.</p>
          </div>
        </div>
      </div>

      {/* Sovereign Defense Commitment Badge */}
      <div className="p-8 rounded-2xl border border-slate-800/90 bg-[#071126]/85 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <span className="w-3.5 h-2 bg-[#FF9933] rounded-xs shadow-[0_0_6px_rgba(255,153,51,0.6)]" />
              <span className="w-3.5 h-2 bg-[#FFFFFF] rounded-xs shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
              <span className="w-3.5 h-2 bg-[#128807] rounded-xs shadow-[0_0_6px_rgba(18,136,7,0.6)]" />
            </div>
            <span className="text-sm font-mono font-bold text-white tracking-wide">
              Built for a Safer Nation
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Engineered proudly for national defense sovereignty, zero external data dependency, and uncompromised perimeter protection.
          </p>
        </div>
      </div>
    </div>
  );
};
