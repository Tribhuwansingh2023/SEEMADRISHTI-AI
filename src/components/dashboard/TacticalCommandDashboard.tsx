import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Settings,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  AlertTriangle,
  User,
  Car,
  Truck,
  Bike,
  ScanLine,
  Clock,
  ClipboardList,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  CheckCircle2,
  Shield,
  Activity,
  Layers,
  Sparkles,
  X,
  Radio,
} from 'lucide-react';
import { AlertItem } from '../../types';

interface TacticalCommandDashboardProps {
  alerts?: AlertItem[];
  onSelectAlert?: (alert: AlertItem) => void;
  onNavigate?: (view: string) => void;
}

export const TacticalCommandDashboard: React.FC<TacticalCommandDashboardProps> = ({
  alerts = [],
  onSelectAlert,
  onNavigate,
}) => {
  // Video player controls state
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(42);
  const [duration, setDuration] = useState(195);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullImageModalOpen, setIsFullImageModalOpen] = useState(false);
  const [selectedEventModal, setSelectedEventModal] = useState<any | null>(null);

  // Live CCTV timestamp synced with mock time or real clock
  const [cctvTime, setCctvTime] = useState('22-04-2025 Tue 14:32:18');

  useEffect(() => {
    const updateCctvClock = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayStr = days[d.getDay()];
      const dateStr = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      setCctvTime(`${dateStr} ${dayStr} ${timeStr}`);
    };
    updateCctvClock();
    const interval = setInterval(updateCctvClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync video time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!isNaN(videoRef.current.duration) && videoRef.current.duration > 0) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Live Events Feed Data (Matching the exact items from the screenshot)
  const liveEvents = [
    {
      id: 'ev-1',
      time: '14:32:18',
      title: 'Restricted Zone Intrusion',
      subtitle: 'Person #04 | Zone: Gate Area',
      severity: 'HIGH',
      badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-500/60',
      icon: User,
      iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      titleColor: 'text-rose-400',
    },
    {
      id: 'ev-2',
      time: '14:32:07',
      title: 'Vehicle Detected',
      subtitle: 'Car #02 | Confidence: 96%',
      severity: 'INFO',
      badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
      icon: Car,
      iconBg: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
      titleColor: 'text-sky-300',
    },
    {
      id: 'ev-3',
      time: '14:31:56',
      title: 'Number Plate Detected',
      subtitle: 'OD02AB1234 | Car #02',
      severity: 'INFO',
      badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
      icon: ScanLine,
      iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      titleColor: 'text-emerald-400',
    },
    {
      id: 'ev-4',
      time: '14:31:43',
      title: 'Person Detected',
      subtitle: 'Person #02 | Confidence: 96%',
      severity: 'INFO',
      badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
      icon: User,
      iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      titleColor: 'text-blue-300',
    },
    {
      id: 'ev-5',
      time: '14:31:27',
      title: 'Vehicle Detected',
      subtitle: 'Truck #03 | Confidence: 92%',
      severity: 'INFO',
      badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
      icon: Truck,
      iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      titleColor: 'text-blue-300',
    },
    {
      id: 'ev-6',
      time: '14:30:58',
      title: 'Possible Loitering',
      subtitle: 'Person #06 | 45 sec',
      severity: 'WARNING',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
      icon: Clock,
      iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      titleColor: 'text-amber-400',
    },
    {
      id: 'ev-7',
      time: '14:30:21',
      title: 'Vehicle Stopped',
      subtitle: 'Bike #07 | 32 sec',
      severity: 'WARNING',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
      icon: Bike,
      iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      titleColor: 'text-amber-400',
    },
    {
      id: 'ev-8',
      time: '14:29:17',
      title: 'Crowd Formation',
      subtitle: '5 People | Zone: Checkpoint',
      severity: 'CRITICAL',
      badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-500/60',
      icon: User,
      iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      titleColor: 'text-rose-400',
    },
  ];

  // Recent Detection History table rows
  const detectionHistory = [
    {
      time: '14:32:18',
      object: 'Person #04',
      objectIcon: User,
      iconColor: 'text-rose-400 bg-rose-500/20',
      cls: 'Person',
      plate: '-',
      conf: '91%',
      camera: 'CAM-01',
    },
    {
      time: '14:31:56',
      object: 'Car #02',
      objectIcon: Car,
      iconColor: 'text-sky-400 bg-sky-500/20',
      cls: 'Car',
      plate: 'OD02AB1234',
      conf: '92%',
      camera: 'CAM-01',
    },
    {
      time: '14:31:43',
      object: 'Person #02',
      objectIcon: User,
      iconColor: 'text-blue-400 bg-blue-500/20',
      cls: 'Person',
      plate: '-',
      conf: '96%',
      camera: 'CAM-01',
    },
    {
      time: '14:30:58',
      object: 'Bike #07',
      objectIcon: Bike,
      iconColor: 'text-sky-400 bg-sky-500/20',
      cls: 'Bike',
      plate: '-',
      conf: '88%',
      camera: 'CAM-01',
    },
    {
      time: '14:30:21',
      object: 'Truck #03',
      objectIcon: Truck,
      iconColor: 'text-sky-400 bg-sky-500/20',
      cls: 'Truck',
      plate: '-',
      conf: '92%',
      camera: 'CAM-01',
    },
  ];

  return (
    <div className="flex flex-col gap-4 font-mono select-none text-slate-200">
      {/* ========================================================================= */}
      {/* ROW 1: CAMERA 01 - MAIN GATE (Left) + LIVE EVENTS (Right)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Camera 01 Live Stream Viewport (Col span 8 on lg) */}
        <div
          ref={containerRef}
          className="lg:col-span-8 flex flex-col rounded-xl border border-slate-800/90 bg-[#060c18] overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.8)] relative"
        >
          {/* Card Header Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#081224] border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.3)]">
                <Video size={14} />
              </div>
              <h3 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase">
                CAMERA 01 - MAIN GATE
              </h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
                <span>LIVE</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                AI ACTIVE
              </span>
              <span className="text-[11px] font-mono text-slate-300 tracking-wide font-bold">
                FPS: 28
              </span>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('settings')}
                title="Camera Stream Settings"
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                <Settings size={15} />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                title="Toggle Fullscreen"
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            </div>
          </div>

          {/* Video Player Area with Tactical HUD Overlays */}
          <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              src="/fixtures/visdrone/CAM-01.mp4"
              className="w-full h-full object-cover select-none pointer-events-auto"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onError={(e) => {
                // Fallback to sample fixture if needed
                const target = e.currentTarget;
                if (!target.src.includes('moving_objects.mp4')) {
                  target.src = '/fixtures/moving_objects.mp4';
                }
              }}
            />

            {/* Top-Left CCTV Timestamp OSD */}
            <div className="absolute top-2.5 left-3 z-20 pointer-events-none">
              <span className="font-mono text-xs sm:text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] tracking-wider">
                {cctvTime}
              </span>
            </div>

            {/* 1. Tactical AI Bounding Box Overlays */}
            {/* Truck #03 92% (Blue Box at top center entrance) */}
            <div
              className="absolute z-20 pointer-events-none transition-all duration-300"
              style={{
                top: '16%',
                left: '36.5%',
                width: '7.8%',
                height: '14.5%',
              }}
            >
              <div className="w-full h-full border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] relative">
                <div className="absolute -top-4 left-0 bg-blue-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-t-sm whitespace-nowrap shadow-sm">
                  Truck #03 92%
                </div>
              </div>
            </div>

            {/* Car #02 96% (Blue Box on white car) */}
            <div
              className="absolute z-20 pointer-events-none transition-all duration-300"
              style={{
                top: '26%',
                left: '38%',
                width: '6.2%',
                height: '10.5%',
              }}
            >
              <div className="w-full h-full border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] relative">
                <div className="absolute -top-4 left-0 bg-blue-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-t-sm whitespace-nowrap shadow-sm">
                  Car #02 96%
                </div>
              </div>
            </div>

            {/* Bike #07 88% (Blue Box on motorcycle rider) */}
            <div
              className="absolute z-20 pointer-events-none transition-all duration-300"
              style={{
                top: '36%',
                left: '42.2%',
                width: '5.8%',
                height: '15.5%',
              }}
            >
              <div className="w-full h-full border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] relative">
                <div className="absolute -top-4 left-0 bg-blue-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-t-sm whitespace-nowrap shadow-sm">
                  Bike #07 88%
                </div>
              </div>
            </div>

            {/* Person #01 94% (Green Box on left sidewalk soldier) */}
            <div
              className="absolute z-20 pointer-events-none transition-all duration-300"
              style={{
                top: '33.5%',
                left: '21.5%',
                width: '3.4%',
                height: '13.8%',
              }}
            >
              <div className="w-full h-full border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] relative">
                <div className="absolute -top-4 left-0 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-t-sm whitespace-nowrap shadow-sm">
                  Person #01 94%
                </div>
              </div>
            </div>

            {/* Person #02 96% (Green Box on pedestrian near car lane) */}
            <div
              className="absolute z-20 pointer-events-none transition-all duration-300"
              style={{
                top: '34%',
                left: '31.2%',
                width: '3.6%',
                height: '12.8%',
              }}
            >
              <div className="w-full h-full border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] relative">
                <div className="absolute -top-4 left-0 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-t-sm whitespace-nowrap shadow-sm">
                  Person #02 96%
                </div>
              </div>
            </div>

            {/* Person #03 92% (Green Box near guard booth) */}
            <div
              className="absolute z-20 pointer-events-none transition-all duration-300"
              style={{
                top: '30%',
                left: '58.5%',
                width: '3.2%',
                height: '13.2%',
              }}
            >
              <div className="w-full h-full border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] relative">
                <div className="absolute -top-4 left-0 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-t-sm whitespace-nowrap shadow-sm">
                  Person #03 92%
                </div>
              </div>
            </div>

            {/* Person #04 91% (Green Box inside restricted area near traffic cones) */}
            <div
              className="absolute z-20 pointer-events-none transition-all duration-300"
              style={{
                top: '26%',
                left: '50.8%',
                width: '3.4%',
                height: '11.5%',
              }}
            >
              <div className="w-full h-full border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] relative">
                <div className="absolute -top-4 left-0 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-t-sm whitespace-nowrap shadow-sm">
                  Person #04 91%
                </div>
              </div>
            </div>

            {/* 2. Red Shaded Restricted Zone Lane with Warning Badge */}
            <div
              className="absolute z-10 pointer-events-none"
              style={{
                top: '38%',
                left: '49%',
                width: '28%',
                height: '24%',
                clipPath: 'polygon(18% 0%, 75% 0%, 100% 100%, 0% 100%)',
                background: 'rgba(239, 68, 68, 0.38)',
                borderTop: '2px dashed rgba(239, 68, 68, 0.85)',
                borderBottom: '2px dashed rgba(239, 68, 68, 0.85)',
                boxShadow: 'inset 0 0 20px rgba(220, 38, 38, 0.5)',
              }}
            />

            {/* Restricted Zone Centered Badge */}
            <div
              className="absolute z-20 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded bg-rose-600/95 border border-rose-400 text-white text-[11px] font-bold shadow-[0_0_15px_rgba(225,29,72,0.8)] animate-pulse"
              style={{
                top: '46%',
                left: '56%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <AlertTriangle size={13} className="text-white fill-white" />
              <span>Restricted Zone</span>
            </div>

            {/* 3. High-Contrast License Plate Inset Box (Bottom Left) */}
            <div className="absolute bottom-3 left-3 z-30 pointer-events-auto rounded-lg overflow-hidden border border-amber-500/80 shadow-[0_10px_25px_rgba(0,0,0,0.9)] bg-black/90 backdrop-blur-md">
              <div className="bg-amber-400 px-2.5 py-0.5 text-black font-mono font-black text-[10px] tracking-wider flex items-center justify-between gap-3">
                <span>Plate: OD02AB1234</span>
                <span className="text-[9px] bg-black/20 px-1 rounded">91%</span>
              </div>
              <div className="p-1.5 bg-[#0a0f1d] flex items-center justify-center">
                <div className="px-3 py-1 rounded border-2 border-slate-900 bg-white shadow-inner flex items-center gap-2">
                  <div className="flex flex-col items-center justify-center border-r border-slate-400 pr-1 text-[8px] leading-tight font-sans font-bold text-blue-900">
                    <span>IND</span>
                  </div>
                  <span className="text-sm font-black font-mono text-black tracking-widest leading-none">
                    OD02AB1234
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Video Controls Scrubber Bar */}
          <div className="px-3.5 py-2 bg-[#050a14] border-t border-slate-800/80 flex items-center gap-3 text-slate-300">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlayPause}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1 active:scale-95"
              title={isPlaying ? 'Pause Feed' : 'Resume Feed'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* Scrubber Range */}
            <div className="flex-1 flex items-center relative group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2 transition-all focus:outline-hidden"
              />
            </div>

            {/* Time Stamp */}
            <span className="text-[11px] font-mono text-slate-400 shrink-0 select-none">
              {formatSeconds(currentTime)} / {formatSeconds(duration || 195)}
            </span>

            {/* Mute/Unmute */}
            <button
              type="button"
              onClick={toggleMute}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1 active:scale-95"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* HD Badge */}
            <span className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800/60 text-[10px] font-bold text-slate-300">
              HD
            </span>

            {/* Maximize */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1 active:scale-95"
              title="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Right: Live Events Feed Card (Col span 4 on lg) */}
        <div className="lg:col-span-4 flex flex-col rounded-xl border border-slate-800/90 bg-[#060c18] overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
          {/* Card Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#081224] border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ClipboardList size={13} />
              </div>
              <h3 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase">
                LIVE EVENTS
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('alerts')}
              className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer group"
            >
              <span>View All</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Events List */}
          <div className="flex-1 p-2 sm:p-2.5 space-y-1.5 overflow-y-auto max-h-[380px] lg:max-h-[390px] custom-scrollbar">
            {liveEvents.map((ev) => {
              const IconComp = ev.icon;
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventModal(ev)}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#081020]/90 hover:bg-[#0c1830] border border-slate-800/60 hover:border-slate-700/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${ev.iconBg}`}
                    >
                      <IconComp size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-300 font-mono">
                          {ev.time}
                        </span>
                        <span className={`text-xs font-bold truncate ${ev.titleColor}`}>
                          {ev.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate font-mono">
                        {ev.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border uppercase flex items-center gap-1 ${ev.badgeClass}`}
                    >
                      {ev.severity === 'HIGH' && '▲ HIGH'}
                      {ev.severity === 'INFO' && 'ℹ INFO'}
                      {ev.severity === 'WARNING' && '★ WARNING'}
                      {ev.severity === 'CRITICAL' && '★ CRITICAL'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: KPI METRIC CARDS (4 cards) + DETECTION CLASSES (Donut chart card)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: PEOPLE */}
        <div className="rounded-xl border border-slate-800/90 bg-[#060c18] p-3.5 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-xs">
              <User size={18} />
            </div>
            <div className="flex items-center gap-0.5 text-emerald-400 font-mono text-[11px] font-bold">
              <span>↑ 12%</span>
            </div>
          </div>

          <div className="mt-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              PEOPLE
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                4
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Current</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
            Total Seen: 12
          </div>
        </div>

        {/* Metric 2: VEHICLES */}
        <div className="rounded-xl border border-slate-800/90 bg-[#060c18] p-3.5 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-xs">
              <Car size={18} />
            </div>
            <div className="flex items-center gap-0.5 text-emerald-400 font-mono text-[11px] font-bold">
              <span>↑ 8%</span>
            </div>
          </div>

          <div className="mt-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              VEHICLES
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                3
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Current</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
            Total Seen: 8
          </div>
        </div>

        {/* Metric 3: PLATES */}
        <div className="rounded-xl border border-slate-800/90 bg-[#060c18] p-3.5 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-xs">
              <ScanLine size={18} />
            </div>
            <div className="flex items-center gap-0.5 text-emerald-400 font-mono text-[11px] font-bold">
              <span>↑ 5%</span>
            </div>
          </div>

          <div className="mt-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              PLATES
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                1
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Detected</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
            Total: 5
          </div>
        </div>

        {/* Metric 4: ALERTS */}
        <div className="rounded-xl border border-slate-800/90 bg-[#060c18] p-3.5 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs">
              <AlertTriangle size={18} />
            </div>
            <div className="flex items-center gap-0.5 text-amber-400 font-mono text-[11px] font-bold">
              <span>↑ 50%</span>
            </div>
          </div>

          <div className="mt-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              ALERTS
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-white font-mono leading-none">
                3
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Today</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
            Critical: 1
          </div>
        </div>

        {/* Metric 5: DETECTION CLASSES (Donut Chart Widget) */}
        <div className="rounded-xl border border-slate-800/90 bg-[#060c18] p-3 flex flex-col justify-between shadow-md">
          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            DETECTION CLASSES
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            {/* SVG Donut Chart */}
            <div className="relative w-22 h-22 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Circumference = 2 * PI * 36 ≈ 226.2 */}
                {/* Person 40% (cyan #06b6d4): length = 90.48 */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#06b6d4"
                  strokeWidth="11"
                  strokeDasharray="90.5 226.2"
                  strokeDashoffset="0"
                />
                {/* Car 30% (blue #3b82f6): length = 67.86 */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="11"
                  strokeDasharray="67.9 226.2"
                  strokeDashoffset="-90.5"
                />
                {/* Bike 15% (emerald #10b981): length = 33.93 */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="11"
                  strokeDasharray="33.9 226.2"
                  strokeDashoffset="-158.4"
                />
                {/* Truck 10% (sky #38bdf8): length = 22.62 */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#38bdf8"
                  strokeWidth="11"
                  strokeDasharray="22.6 226.2"
                  strokeDashoffset="-192.3"
                />
                {/* Bus 5% (purple #a855f7): length = 11.31 */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#a855f7"
                  strokeWidth="11"
                  strokeDasharray="11.3 226.2"
                  strokeDashoffset="-214.9"
                />
              </svg>

              {/* Centered Total Count */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-black text-white font-mono leading-none">
                  12
                </span>
                <span className="text-[7px] text-slate-400 font-mono mt-0.5 leading-tight">
                  Total Detections
                </span>
              </div>
            </div>

            {/* Donut Legend Breakdown */}
            <div className="flex-1 space-y-1 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#06b6d4]" />
                  <span className="text-slate-300">Person</span>
                </div>
                <span className="font-bold text-slate-200">40%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#3b82f6]" />
                  <span className="text-slate-300">Car</span>
                </div>
                <span className="font-bold text-slate-200">30%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#10b981]" />
                  <span className="text-slate-300">Bike</span>
                </div>
                <span className="font-bold text-slate-200">15%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#38bdf8]" />
                  <span className="text-slate-300">Truck</span>
                </div>
                <span className="font-bold text-slate-200">10%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#a855f7]" />
                  <span className="text-slate-300">Bus</span>
                </div>
                <span className="font-bold text-slate-200">5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: RECENT DETECTION HISTORY | SYSTEM PERFORMANCE | RECENT SNAPSHOT   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Panel 1: RECENT DETECTION HISTORY (Col span 4.5 -> 4 on lg) */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800/90 bg-[#060c18] p-3 flex flex-col justify-between shadow-md overflow-hidden">
          <div className="text-[11px] font-black uppercase text-white tracking-wider pb-2 border-b border-slate-800/80">
            RECENT DETECTION HISTORY
          </div>

          <div className="overflow-x-auto my-1">
            <table className="w-full text-left text-[10px] font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/60">
                  <th className="py-1 font-semibold">Time</th>
                  <th className="py-1 font-semibold">Object</th>
                  <th className="py-1 font-semibold">Class</th>
                  <th className="py-1 font-semibold">Plate</th>
                  <th className="py-1 font-semibold">Conf.</th>
                  <th className="py-1 font-semibold">Camera</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {detectionHistory.map((row, idx) => {
                  const IconComp = row.objectIcon;
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="py-1.5 text-slate-400">{row.time}</td>
                      <td className="py-1.5 font-bold flex items-center gap-1.5 text-slate-200">
                        <span className={`p-0.5 rounded-full ${row.iconColor}`}>
                          <IconComp size={10} />
                        </span>
                        <span>{row.object}</span>
                      </td>
                      <td className="py-1.5 text-slate-400">{row.cls}</td>
                      <td className="py-1.5 font-bold text-amber-400">{row.plate}</td>
                      <td className="py-1.5 text-slate-300">{row.conf}</td>
                      <td className="py-1.5 text-slate-400">{row.camera}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: SYSTEM PERFORMANCE (Col span 5 on lg) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800/90 bg-[#060c18] p-3 flex flex-col justify-between shadow-md">
          <div className="text-[11px] font-black uppercase text-white tracking-wider pb-2 border-b border-slate-800/80">
            SYSTEM PERFORMANCE
          </div>

          {/* 4 Radial Gauges in a Row */}
          <div className="grid grid-cols-4 gap-2 my-2 py-1 items-center justify-items-center">
            {/* Gauge 1: 28 FPS (Video) */}
            <div className="flex flex-col items-center">
              <div className="relative w-15 h-15 flex items-center justify-center">
                <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="5"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="5"
                    strokeDasharray="150.8"
                    strokeDashoffset="42"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-white font-mono leading-none">
                    28
                  </span>
                  <span className="text-[8px] text-blue-400 font-bold leading-none mt-0.5">
                    FPS
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-1">(Video)</span>
            </div>

            {/* Gauge 2: 18 FPS (AI Inference) */}
            <div className="flex flex-col items-center">
              <div className="relative w-15 h-15 flex items-center justify-center">
                <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="5"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="transparent"
                    stroke="#06b6d4"
                    strokeWidth="5"
                    strokeDasharray="150.8"
                    strokeDashoffset="65"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-white font-mono leading-none">
                    18
                  </span>
                  <span className="text-[8px] text-cyan-400 font-bold leading-none mt-0.5">
                    FPS
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-1">(AI Inference)</span>
            </div>

            {/* Gauge 3: 68% GPU Usage */}
            <div className="flex flex-col items-center">
              <div className="relative w-15 h-15 flex items-center justify-center">
                <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="5"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="5"
                    strokeDasharray="150.8"
                    strokeDashoffset="48"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-white font-mono leading-none">
                    68%
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-1">GPU Usage</span>
            </div>

            {/* Gauge 4: 42% RAM Usage */}
            <div className="flex flex-col items-center">
              <div className="relative w-15 h-15 flex items-center justify-center">
                <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="5"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="transparent"
                    stroke="#38bdf8"
                    strokeWidth="5"
                    strokeDasharray="150.8"
                    strokeDashoffset="87"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-white font-mono leading-none">
                    42%
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-1">RAM Usage</span>
            </div>
          </div>

          {/* Hardware & Model Specs Metadata Footer */}
          <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono flex items-center justify-between flex-wrap gap-1 px-1">
            <div>
              Model: <span className="text-cyan-400 font-bold">YOLOv8s</span>
            </div>
            <span className="text-slate-600">|</span>
            <div>
              Input: <span className="text-slate-200 font-bold">1280</span>
            </div>
            <span className="text-slate-600">|</span>
            <div>
              Device: <span className="text-emerald-400 font-bold">GPU (CUDA)</span>
            </div>
            <span className="text-slate-600">|</span>
            <div>
              Tracker: <span className="text-cyan-400 font-bold">ByteTrack</span>
            </div>
          </div>
        </div>

        {/* Panel 3: RECENT SNAPSHOT (Col span 3 on lg) */}
        <div className="lg:col-span-3 rounded-xl border border-slate-800/90 bg-[#060c18] p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-[11px] font-mono pb-2 border-b border-slate-800/80">
            <span className="font-black uppercase text-white tracking-wider">
              RECENT SNAPSHOT
            </span>
            <span className="text-slate-500 text-[9px]">22 Apr 2025 14:32:18</span>
          </div>

          <div
            className="my-2 rounded-lg overflow-hidden border border-slate-700/80 bg-black relative group cursor-pointer aspect-video"
            onClick={() => setIsFullImageModalOpen(true)}
          >
            <img
              src="/assets/recent_snapshot.jpg"
              alt="Recent CCTV Detection Snapshot"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('cam01_preview.jpg')) {
                  target.src = '/fixtures/visdrone/cam01_preview.jpg';
                }
              }}
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="px-2 py-1 rounded bg-black/80 text-white text-[10px] font-bold border border-white/20">
                Click to Enlarge
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFullImageModalOpen(true)}
            className="w-full py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 bg-[#081224] hover:bg-[#0c1830] text-slate-300 hover:text-white text-[10px] font-bold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <ImageIcon size={12} />
            <span>View Full Image</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER BAR: SEEMADRISHTI v1.0.0 | BUILT FOR A SAFER NATION         */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-2 pt-2 text-[10px] font-mono text-slate-500 select-none">
        <div className="flex items-center gap-2">
          {/* Hexagon Shield Icon */}
          <div className="w-4 h-4 rounded-xs border border-cyan-500/50 flex items-center justify-center text-cyan-400 rotate-45">
            <span className="-rotate-45 text-[8px] font-black">S</span>
          </div>
          <span className="text-slate-400 font-bold tracking-wider">
            SEEMADRISHTI
          </span>
          <span className="text-slate-600 font-mono">v1.0.0</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Indian Tricolor Indicator Badge */}
          <div className="flex items-center gap-0.5">
            <span className="w-2.5 h-1.5 bg-[#FF9933] rounded-xs" />
            <span className="w-2.5 h-1.5 bg-[#FFFFFF] rounded-xs" />
            <span className="w-2.5 h-1.5 bg-[#128807] rounded-xs" />
          </div>
          <span className="text-slate-400 font-semibold tracking-wide">
            Built for a Safer Nation
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULL IMAGE MODAL                                                          */}
      {/* ========================================================================= */}
      {isFullImageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsFullImageModalOpen(false)}
        >
          <div
            className="max-w-4xl w-full rounded-2xl bg-[#070e1c] border border-cyan-500/40 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  High-Resolution Snapshot — CAM-01 (Main Gate Checkpoint)
                </h3>
              </div>
              <button
                onClick={() => setIsFullImageModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-black">
              <img
                src="/assets/recent_snapshot.jpg"
                alt="Full Resolution Snapshot"
                className="w-full max-h-[70vh] object-contain mx-auto"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('cam01_preview.jpg')) {
                    target.src = '/fixtures/visdrone/cam01_preview.jpg';
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
              <span>Timestamp: 22-04-2025 14:32:18</span>
              <span>Resolution: 1920x1080 (HD CCTV)</span>
              <span>Detection Confidence: 96%</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EVENT DETAIL MODAL                                                        */}
      {/* ========================================================================= */}
      {selectedEventModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedEventModal(null)}
        >
          <div
            className="max-w-md w-full rounded-2xl bg-[#081224] border border-slate-700 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${selectedEventModal.badgeClass}`}
                >
                  {selectedEventModal.severity}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {selectedEventModal.time}
                </span>
              </div>
              <button
                onClick={() => setSelectedEventModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="my-4 space-y-2 font-mono">
              <h4 className="text-base font-bold text-white">
                {selectedEventModal.title}
              </h4>
              <p className="text-xs text-slate-300">
                {selectedEventModal.subtitle}
              </p>
              <div className="p-3 rounded-lg bg-black/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Source Camera: CAMERA 01 - MAIN GATE</div>
                <div>Perimeter Zone: Perimeter Sector Alpha</div>
                <div>Status: Auto-logged to Incident Evidence Vault</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedEventModal(null);
                  if (onNavigate) onNavigate('alerts');
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all cursor-pointer"
              >
                Inspect in Alert Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
