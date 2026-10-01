import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Settings,
  Maximize2,
  AlertTriangle,
  User,
  Car,
  Truck,
  Bike,
  ScanLine,
  Clock,
  ClipboardList,
  Shield,
  Layers,
  LayoutDashboard,
  Radio,
  Sliders,
  Bell,
  History,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { SeemadrishtiLogo } from '../layout/SeemadrishtiLogo';

interface HeroDashboard3DProps {
  onOpenApp?: () => void;
}

export const HeroDashboard3D: React.FC<HeroDashboard3DProps> = ({ onOpenApp }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(4);
  const [rotateY, setRotateY] = useState(-13);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth mouse tilt parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rY = -13 + ((x - centerX) / centerX) * 8;
    const rX = 4 - ((y - centerY) / centerY) * 8;

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(4);
    setRotateY(-13);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[700px] lg:max-w-[780px] xl:max-w-[840px] select-none cursor-pointer group"
      style={{ perspective: '1400px' }}
      onClick={onOpenApp}
      title="Click to launch Live Tactical Command Dashboard"
    >
      {/* 3D Cyan Ambient Hologram Glow Underneath */}
      <div
        className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-cyan-500/25 via-teal-500/20 to-blue-600/30 blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none"
        style={{
          transform: `perspective(1400px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(-20px)`,
        }}
      />

      {/* Main 3D Tilted Device Container */}
      <div
        className="relative rounded-2xl p-1 sm:p-1.5 border-2 border-cyan-400/60 group-hover:border-cyan-300 bg-[#040814]/95 shadow-[0_25px_60px_rgba(0,240,255,0.35),0_0_25px_rgba(6,182,212,0.3)] transition-transform duration-200 ease-out overflow-hidden"
        style={{
          transform: `perspective(1400px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${
            isHovered ? 0.99 : 0.96
          })`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Holographic Gloss Sweep Highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/5 to-white/10 pointer-events-none z-40 rounded-2xl" />

        {/* Floating "Live Interactivity" Hover Pill */}
        <div className="absolute top-3 right-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-400 text-cyan-300 text-[10px] font-mono font-bold shadow-lg">
          <span>Launch Dashboard</span>
          <ExternalLink size={11} />
        </div>

        {/* DASHBOARD INTERIOR DISPLAY */}
        <div className="rounded-xl bg-[#060c18] overflow-hidden border border-slate-800 flex flex-col font-mono text-slate-200">
          {/* 1. Header Bar */}
          <div className="px-3 py-2 bg-[#050b16] border-b border-slate-800/80 flex items-center justify-between text-[10px]">
            {/* Left Logo & Brand */}
            <div className="flex items-center gap-2">
              <SeemadrishtiLogo size={20} />
              <div className="flex items-center gap-1">
                <span className="font-black text-white tracking-wider">SEEMADRISHTI</span>
              </div>
            </div>

            {/* Right System Online, Clock & Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI ACTIVE</span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-slate-300 text-[9px]">
                <Clock size={11} className="text-slate-400" />
                <span>22 Apr 2025 14:32:18</span>
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-[9px]">
                <div className="w-4 h-4 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <User size={9} />
                </div>
                <span className="hidden xs:inline font-bold text-white">Admin</span>
              </div>
            </div>
          </div>

          {/* 2. Main Dashboard Split Layout: Sidebar + Main Stage */}
          <div className="grid grid-cols-12 min-h-0 bg-[#030712]">
            {/* Miniature Left Sidebar (2 cols) */}
            <div className="col-span-2 hidden md:flex flex-col bg-[#050a14] border-r border-slate-800/80 p-1.5 space-y-1 text-[9px]">
              <div className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm">
                <LayoutDashboard size={11} />
                <span className="hidden lg:inline">Dashboard</span>
              </div>

              <div className="px-2 py-1 rounded-lg text-slate-400 hover:text-white flex items-center gap-1.5">
                <Video size={11} />
                <span className="hidden lg:inline">Live Monitoring</span>
              </div>

              <div className="px-2 py-1 rounded-lg text-slate-400 hover:text-white flex items-center gap-1.5">
                <Layers size={11} />
                <span className="hidden lg:inline">Analytics</span>
              </div>

              <div className="px-2 py-1 rounded-lg text-slate-400 hover:text-white flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <Bell size={11} />
                  <span className="hidden lg:inline">Alerts</span>
                </div>
                <span className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[8px] flex items-center justify-center font-bold">
                  7
                </span>
              </div>

              <div className="px-2 py-1 rounded-lg text-slate-400 hover:text-white flex items-center gap-1.5">
                <History size={11} />
                <span className="hidden lg:inline">History</span>
              </div>

              <div className="px-2 py-1 rounded-lg text-slate-400 hover:text-white flex items-center gap-1.5">
                <MapPin size={11} />
                <span className="hidden lg:inline">Zones</span>
              </div>

              <div className="px-2 py-1 rounded-lg text-slate-400 hover:text-white flex items-center gap-1.5">
                <Settings size={11} />
                <span className="hidden lg:inline">Settings</span>
              </div>
            </div>

            {/* Main Stage: Camera + Events + Metrics (10 cols on md, 12 on mobile) */}
            <div className="col-span-12 md:col-span-10 p-2 sm:p-2.5 flex flex-col gap-2">
              {/* Row 1: Camera Feed (Left) + Live Events (Right) */}
              <div className="grid grid-cols-12 gap-2">
                {/* Camera Feed with Overlays (8 cols) */}
                <div className="col-span-8 flex flex-col rounded-lg border border-slate-800 bg-[#060c18] overflow-hidden">
                  <div className="px-2 py-1 bg-[#081224] border-b border-slate-800 flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>CAMERA 01 - MAIN GATE</span>
                    </div>
                    <span className="text-slate-400 font-bold">FPS: 28</span>
                  </div>

                  {/* Video Viewport with Bounding Boxes */}
                  <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                    <video
                      src="/fixtures/visdrone/CAM-01.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('moving_objects.mp4')) {
                          target.src = '/fixtures/moving_objects.mp4';
                        }
                      }}
                    />

                    {/* Timestamp */}
                    <div className="absolute top-1 left-1.5 text-[8px] font-bold text-white drop-shadow-md">
                      22-04-2025 Tue 14:32:18
                    </div>

                    {/* Truck #03 92% Box */}
                    <div
                      className="absolute z-20 pointer-events-none"
                      style={{ top: '16%', left: '36.5%', width: '8%', height: '15%' }}
                    >
                      <div className="w-full h-full border border-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)] relative">
                        <span className="absolute -top-3 left-0 bg-blue-600 text-white text-[6px] px-1 rounded-t-xs">
                          Truck #03 92%
                        </span>
                      </div>
                    </div>

                    {/* Car #02 96% Box */}
                    <div
                      className="absolute z-20 pointer-events-none"
                      style={{ top: '26%', left: '38%', width: '7%', height: '11%' }}
                    >
                      <div className="w-full h-full border border-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)] relative">
                        <span className="absolute -top-3 left-0 bg-blue-600 text-white text-[6px] px-1 rounded-t-xs">
                          Car #02 96%
                        </span>
                      </div>
                    </div>

                    {/* Bike #07 88% Box */}
                    <div
                      className="absolute z-20 pointer-events-none"
                      style={{ top: '36%', left: '42.2%', width: '6%', height: '16%' }}
                    >
                      <div className="w-full h-full border border-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)] relative">
                        <span className="absolute -top-3 left-0 bg-blue-600 text-white text-[6px] px-1 rounded-t-xs">
                          Bike #07 88%
                        </span>
                      </div>
                    </div>

                    {/* Person #01 94% Box */}
                    <div
                      className="absolute z-20 pointer-events-none"
                      style={{ top: '33.5%', left: '21.5%', width: '4%', height: '14%' }}
                    >
                      <div className="w-full h-full border border-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] relative">
                        <span className="absolute -top-3 left-0 bg-emerald-600 text-white text-[6px] px-1 rounded-t-xs">
                          Person #01 94%
                        </span>
                      </div>
                    </div>

                    {/* Restricted Zone Polygon & Pill */}
                    <div
                      className="absolute z-10 pointer-events-none"
                      style={{
                        top: '38%',
                        left: '49%',
                        width: '28%',
                        height: '24%',
                        clipPath: 'polygon(18% 0%, 75% 0%, 100% 100%, 0% 100%)',
                        background: 'rgba(239, 68, 68, 0.4)',
                        borderTop: '1px dashed rgba(239, 68, 68, 0.9)',
                      }}
                    />
                    <div
                      className="absolute z-20 pointer-events-none px-1.5 py-0.5 rounded bg-rose-600 text-white text-[7px] font-bold shadow-md"
                      style={{ top: '46%', left: '56%', transform: 'translate(-50%, -50%)' }}
                    >
                      ⚠ Restricted Zone
                    </div>

                    {/* License Plate Inset */}
                    <div className="absolute bottom-1 left-1.5 rounded border border-amber-500/80 bg-black/95 text-[7px] p-0.5 shadow-lg">
                      <div className="bg-amber-400 text-black px-1 font-black">
                        Plate: OD02AB1234 91%
                      </div>
                      <div className="px-1 py-0.2 bg-white text-black font-black text-center">
                        OD02AB1234
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Events Feed (4 cols) */}
                <div className="col-span-4 rounded-lg border border-slate-800 bg-[#060c18] p-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[9px] font-bold text-white">
                    <span>LIVE EVENTS</span>
                    <span className="text-emerald-400 text-[8px]">View All →</span>
                  </div>

                  <div className="space-y-1 my-1 overflow-hidden">
                    <div className="flex items-center justify-between p-1 rounded bg-rose-950/60 border border-rose-500/40 text-[8px]">
                      <div className="truncate text-rose-300 font-bold">
                        14:32:18 Restricted Zone Intrusion
                      </div>
                      <span className="text-[7px] text-rose-400 font-bold">HIGH</span>
                    </div>

                    <div className="flex items-center justify-between p-1 rounded bg-sky-950/50 border border-sky-500/30 text-[8px]">
                      <div className="truncate text-sky-300">
                        14:32:07 Vehicle Detected (Car #02)
                      </div>
                      <span className="text-[7px] text-sky-400 font-bold">INFO</span>
                    </div>

                    <div className="flex items-center justify-between p-1 rounded bg-sky-950/50 border border-sky-500/30 text-[8px]">
                      <div className="truncate text-emerald-300">
                        14:31:56 Number Plate OD02AB1234
                      </div>
                      <span className="text-[7px] text-sky-400 font-bold">INFO</span>
                    </div>

                    <div className="flex items-center justify-between p-1 rounded bg-amber-950/50 border border-amber-500/30 text-[8px]">
                      <div className="truncate text-amber-300">
                        14:30:58 Possible Loitering
                      </div>
                      <span className="text-[7px] text-amber-400 font-bold">WARN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: KPI Metrics + Donut Widget */}
              <div className="grid grid-cols-5 gap-1.5 text-[8px]">
                {/* Metric 1 */}
                <div className="p-1 rounded-md bg-[#081224] border border-slate-800 flex flex-col">
                  <div className="flex justify-between text-slate-400">
                    <span>PEOPLE</span>
                    <span className="text-emerald-400">↑ 12%</span>
                  </div>
                  <span className="text-base font-black text-white font-mono mt-0.5">4</span>
                </div>

                {/* Metric 2 */}
                <div className="p-1 rounded-md bg-[#081224] border border-slate-800 flex flex-col">
                  <div className="flex justify-between text-slate-400">
                    <span>VEHICLES</span>
                    <span className="text-emerald-400">↑ 8%</span>
                  </div>
                  <span className="text-base font-black text-white font-mono mt-0.5">3</span>
                </div>

                {/* Metric 3 */}
                <div className="p-1 rounded-md bg-[#081224] border border-slate-800 flex flex-col">
                  <div className="flex justify-between text-slate-400">
                    <span>PLATES</span>
                    <span className="text-emerald-400">↑ 5%</span>
                  </div>
                  <span className="text-base font-black text-white font-mono mt-0.5">1</span>
                </div>

                {/* Metric 4 */}
                <div className="p-1 rounded-md bg-[#081224] border border-slate-800 flex flex-col">
                  <div className="flex justify-between text-slate-400">
                    <span>ALERTS</span>
                    <span className="text-amber-400">↑ 50%</span>
                  </div>
                  <span className="text-base font-black text-white font-mono mt-0.5">3</span>
                </div>

                {/* Donut Mini Widget */}
                <div className="p-1 rounded-md bg-[#081224] border border-slate-800 flex items-center justify-between">
                  <div className="relative w-8 h-8 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="#06b6d4" strokeWidth="16" strokeDasharray="100 238" />
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="16" strokeDasharray="70 238" strokeDashoffset="-100" />
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="16" strokeDasharray="40 238" strokeDashoffset="-170" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white">
                      12
                    </div>
                  </div>
                  <div className="text-[7px] leading-tight text-slate-400">
                    <div className="text-cyan-400 font-bold">40% Person</div>
                    <div className="text-blue-400">30% Car</div>
                    <div className="text-emerald-400">15% Bike</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
