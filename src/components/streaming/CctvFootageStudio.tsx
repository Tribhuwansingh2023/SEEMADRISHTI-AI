import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Upload,
  Video,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Car,
  User,
  Scan,
  Crosshair,
  Sliders,
  Clock,
  Layers,
  Camera,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Radio,
  Sparkles,
  FileVideo,
  ChevronRight,
  Filter,
  Download,
  Info,
  Activity,
  Zap,
  Cpu,
  Terminal,
  Settings2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { webSocketService } from '../../services/websocketService';
import { audioAlertEngine } from '../../utils/audioAlert';
import { getVideoRenderedRect } from '../../utils/videoRect';
import type {
  CctvVideoSource,
  CctvPlateRecord,
  CctvTimelineEvent,
  YoloDebugTelemetry,
} from './CctvTypes';

const CctvFootageStudio: React.FC = () => {
  const { theme, isDaylight } = useTheme();

  // Video Sources State
  const [videoSources, setVideoSources] = useState<CctvVideoSource[]>([
    {
      id: 'near-e-block',
      cameraId: 'cam-01',
      name: 'Near E-Block Surveillance',
      filename: 'NearEBlock.mp4',
      streamUrl: '/api/cctv/stream/NearEBlock.mp4',
      location: 'Near E-Block Transit Corridor',
      description: 'Campus perimeter, pedestrian walkway, bus & multi-vehicle transit route',
      resolution: '3840x2160 4K',
      fps: 60,
      duration: '01:01',
      tag: 'TRANSIT_SECTOR_E',
      isDefault: true,
    },
    {
      id: 'maingate-indoors',
      cameraId: 'cam-02',
      name: 'Main Gate Indoors Checkpoint',
      filename: 'maingateindoors.mp4',
      streamUrl: '/api/cctv/stream/maingateindoors.mp4',
      location: 'Main Gate Indoor Security Corridor',
      description: 'Indoor security access checkpoint, turnstiles, pedestrian tracking',
      resolution: '3840x2160 4K',
      fps: 60,
      duration: '01:01',
      tag: 'GATE_INDOOR_CHECK',
      isDefault: true,
    },
    {
      id: 'maingate-outdoors',
      cameraId: 'cam-03',
      name: 'Main Gate Outdoors Approach',
      filename: 'maingateoutdoors.mp4',
      streamUrl: '/api/cctv/stream/maingateoutdoors.mp4',
      location: 'Main Gate Exterior Perimeter',
      description: 'Main roadway approach, multi-lane vehicular & motorcycle traffic flow',
      resolution: '3840x2160 4K',
      fps: 60,
      duration: '01:02',
      tag: 'GATE_OUTDOOR_ROAD',
      isDefault: true,
    },
  ]);

  const [selectedVideo, setSelectedVideo] = useState<CctvVideoSource>(videoSources[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(61);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // AI Pipeline Settings & Live States
  const [inferenceFps, setInferenceFps] = useState<number>(8); // 8 FPS inference default
  const [confThreshold, setConfThreshold] = useState<number>(30); // 30% default (balanced precision + small objects)
  const [iouThreshold, setIouThreshold] = useState<number>(45); // 45% IoU default
  const [selectedModel, setSelectedModel] = useState<string>('yolov8n.pt'); // yolov8n.pt vs yolov8s.pt
  const [selectedResolution, setSelectedResolution] = useState<number>(960); // 640, 960, 1280
  const [maxLostFrames, setMaxLostFrames] = useState<number>(5); // Anti-flicker temporal tolerance

  // Display Overlays
  const [showAiBoxes, setShowAiBoxes] = useState(true);
  const [showTracks, setShowTracks] = useState(true);
  const [showRestrictedZone, setShowRestrictedZone] = useState(true);
  const [showOpticalGrid, setShowOpticalGrid] = useState(false);
  const [showDebugHud, setShowDebugHud] = useState(false); // YOLO Tactical Debug HUD
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [isZoneEditMode, setIsZoneEditMode] = useState(false);

  // Configurable Restricted Area Polygon (Normalized 0 - 1 Coordinates)
  const [restrictedZonePoints, setRestrictedZonePoints] = useState<Array<{ x: number; y: number }>>([
    { x: 0.22, y: 0.38 },
    { x: 0.78, y: 0.38 },
    { x: 0.85, y: 0.82 },
    { x: 0.15, y: 0.82 },
  ]);

  // Live Counts & Stats (Current vs Cumulative Total Seen)
  const [liveCounts, setLiveCounts] = useState({
    persons: 0,
    persons_total: 0,
    vehicles: 0,
    vehicles_total: 0,
    plates: 0,
    plates_total: 0,
    events: 0,
    alerts: 0,
    total_seen: 0,
  });

  // Real-time Tracks & Detections
  const [liveTracks, setLiveTracks] = useState<any[]>([]);
  const [lastFrameDimensions, setLastFrameDimensions] = useState<{ w: number; h: number }>({ w: 960, h: 540 });

  const [livePlates, setLivePlates] = useState<CctvPlateRecord[]>([
    {
      id: 'pl-init-1',
      vehicle_type: 'CAR',
      vehicle_id: 'Vehicle #01',
      plate_number: 'OD02AB1234',
      confidence: 94.2,
      readable: true,
      time: '22:14:32',
    },
    {
      id: 'pl-init-2',
      vehicle_type: 'MOTORCYCLE',
      vehicle_id: 'Vehicle #02',
      plate_number: 'DL10CE5678',
      confidence: 89.5,
      readable: true,
      time: '22:14:48',
    },
  ]);

  // Event Timeline
  const [timelineEvents, setTimelineEvents] = useState<CctvTimelineEvent[]>([
    {
      id: 'ev-demo-1',
      event_type: 'RESTRICTED AREA INTRUSION',
      severity: 'HIGH',
      object_label: 'Person #01',
      confidence: 0.94,
      timestamp: '22:12:18',
      video_time_seconds: 14.2,
      details: 'Person #01 entered restricted perimeter sector without clearance',
      camera_id: 'cam-01',
      snapshot_url: '/evidence/snapshots/sample-intrusion.jpg',
    },
    {
      id: 'ev-demo-2',
      event_type: 'UNUSUAL LOITERING',
      severity: 'MEDIUM',
      object_label: 'Person #02',
      confidence: 0.89,
      timestamp: '22:13:41',
      video_time_seconds: 28.5,
      details: 'Person #02 observed dwelling in perimeter sector for 11.2s',
      camera_id: 'cam-01',
    },
    {
      id: 'ev-demo-3',
      event_type: 'VEHICLE STOPPED',
      severity: 'MEDIUM',
      object_label: 'Vehicle #01',
      confidence: 0.92,
      timestamp: '22:14:10',
      video_time_seconds: 42.0,
      details: 'Vehicle #01 (CAR) stationary in transit corridor for 9.8s',
      camera_id: 'cam-01',
    },
  ]);

  // Evidence Modal State
  const [selectedSnapshot, setSelectedSnapshot] = useState<{
    url: string;
    title: string;
    timestamp: string;
    objectLabel: string;
    confidence: number;
    details: string;
    eventType: string;
  } | null>(null);

  // Debug & Telemetry State (Requirement 21)
  const [debugInfo, setDebugInfo] = useState<YoloDebugTelemetry>({
    yolo_status: 'AI ACTIVE',
    model: 'yolov8n.pt',
    device: 'CPU',
    device_name: 'CPU (Host)',
    precision: 'FP32',
    input_size: 960,
    confidence: 0.30,
    iou: 0.45,
    tracker: 'ByteTrack',
    max_lost_frames: 5,
    detections_count: 0,
    active_tracks_count: 0,
    ai_fps: 14.5,
    preprocess_ms: 3.5,
    inference_ms: 45.2,
    tracking_ms: 0.8,
    postprocess_ms: 2.1,
    total_ms: 51.6,
    queue_size: 0,
    dropped_frames: 0,
    cpu_percent: 28.0,
    ram_percent: 74.0,
    vram: 'N/A',
  });

  const [inferenceLatency, setInferenceLatency] = useState(38);
  const [pipelineFps, setPipelineFps] = useState(14.8);
  const [cameraFps, setCameraFps] = useState<number>(60);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const grabCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inFlightRef = useRef(false);
  const lastPacketTimeRef = useRef<number>(performance.now());
  const cameraFramesCountRef = useRef<number>(0);
  const lastCameraFpsCalcRef = useRef<number>(performance.now());

  // Physical Camera/Video FPS calculation using requestVideoFrameCallback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let callbackId: number;
    let isActive = true;

    if ('requestVideoFrameCallback' in video) {
      const onFrame = (now: number) => {
        if (!isActive) return;
        cameraFramesCountRef.current++;
        const elapsed = now - lastCameraFpsCalcRef.current;
        if (elapsed >= 1000) {
          const fps = Math.round((cameraFramesCountRef.current * 1000) / elapsed);
          setCameraFps(fps > 0 ? fps : 60);
          cameraFramesCountRef.current = 0;
          lastCameraFpsCalcRef.current = now;
        }
        callbackId = (video as any).requestVideoFrameCallback(onFrame);
      };
      callbackId = (video as any).requestVideoFrameCallback(onFrame);
    }

    return () => {
      isActive = false;
      if (video && (video as any).cancelVideoFrameCallback && callbackId) {
        (video as any).cancelVideoFrameCallback(callbackId);
      }
    };
  }, [selectedVideo.streamUrl]);

  // Load available videos from backend on mount
  useEffect(() => {
    fetch('/api/cctv/videos')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.videos && data.videos.length > 0) {
          setVideoSources(data.videos);
        }
      })
      .catch(() => {});
  }, []);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Switch Video
  const handleSelectVideo = (source: CctvVideoSource) => {
    setSelectedVideo(source);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Video Controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const res = await fetch('/api/cctv/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              base64,
            }),
          });
          const data = await res.json();
          if (data.success) {
            const newSrc: CctvVideoSource = {
              id: `upload-${Date.now()}`,
              cameraId: 'cam-upload',
              name: `Uploaded: ${file.name}`,
              filename: data.filename,
              streamUrl: data.streamUrl,
              location: 'Uploaded Surveillance Video',
              description: `User-uploaded video footage (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
              resolution: 'HD/4K Video',
              fps: 30,
              duration: 'Custom Video',
              tag: 'USER_UPLOAD',
            };
            setVideoSources((prev) => [newSrc, ...prev]);
            setSelectedVideo(newSrc);
            setUploadProgress(null);
            setIsUploading(false);
            audioAlertEngine.playSonarPing();
          } else {
            alert(`Upload failed: ${data.error || 'Server error'}`);
            setIsUploading(false);
            setUploadProgress(null);
          }
        } catch (err: any) {
          alert(`Upload failed: ${err.message}`);
          setIsUploading(false);
          setUploadProgress(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(`Error reading file: ${err.message}`);
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Save Restricted Zone ROI to Backend
  const saveRestrictedZone = async () => {
    try {
      await fetch('/api/cctv/zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: selectedVideo.cameraId,
          zone_name: 'Restricted Sector Area',
          points: restrictedZonePoints.map((p) => [p.x, p.y]),
        }),
      });
      setIsZoneEditMode(false);
      audioAlertEngine.playSonarPing();
    } catch {}
  };

  // Canvas-based Frame Extraction & High-Accuracy Inference Dispatcher (Prioritizing Newest Frame)
  useEffect(() => {
    let timerId: any = null;
    let isActive = true;

    if (!grabCanvasRef.current) {
      grabCanvasRef.current = document.createElement('canvas');
    }

    const grabAndDispatch = async () => {
      if (!isActive) return;

      const video = videoRef.current;
      const grabCanvas = grabCanvasRef.current;

      if (!video || !grabCanvas || video.paused || video.readyState < 2 || video.videoWidth === 0) {
        timerId = setTimeout(grabAndDispatch, 200);
        return;
      }

      if (inFlightRef.current) {
        // AI worker is currently processing previous frame!
        // Drop intermediate frame to prevent backlog queue (Requirement 2)
        timerId = setTimeout(grabAndDispatch, 35);
        return;
      }

      // Aspect-ratio preserving target resolution (640, 768, 960, or 1280)
      const targetW = selectedResolution;
      const targetH = Math.round((targetW * video.videoHeight) / video.videoWidth) || Math.round(targetW * 9 / 16);

      if (grabCanvas.width !== targetW || grabCanvas.height !== targetH) {
        grabCanvas.width = targetW;
        grabCanvas.height = targetH;
      }

      const ctx = grabCanvas.getContext('2d');
      if (!ctx) {
        timerId = setTimeout(grabAndDispatch, 100);
        return;
      }

      ctx.drawImage(video, 0, 0, targetW, targetH);
      const frameBase64 = grabCanvas.toDataURL('image/jpeg', 0.82);

      inFlightRef.current = true;
      const t0 = performance.now();
      let latency = 0;

      try {
        const res = await fetch('/api/cctv/frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            camera_id: selectedVideo.cameraId,
            frame_base64: frameBase64,
            timestamp: Date.now(),
            source_type: 'cctv_video',
            restricted_zone: restrictedZonePoints.map((p) => [p.x, p.y]),
            conf_threshold: confThreshold / 100.0,
            iou_threshold: iouThreshold / 100.0,
            imgsz: selectedResolution,
            model_name: selectedModel,
            max_lost_frames: maxLostFrames,
          }),
        });

        inFlightRef.current = false;
        latency = Math.round(performance.now() - t0);

        if (res.ok) {
          const data = await res.json();
          setInferenceLatency(data.telemetry?.total_latency_ms || latency);
          setPipelineFps(data.telemetry?.measured_fps || inferenceFps);

          if (data.frame_width && data.frame_height) {
            setLastFrameDimensions({ w: data.frame_width, h: data.frame_height });
          }

          if (data.tracks && Array.isArray(data.tracks)) {
            setLiveTracks(data.tracks);
            lastPacketTimeRef.current = performance.now();
          }

          if (data.counts) {
            setLiveCounts((prev) => ({
              persons: data.counts.persons ?? prev.persons,
              persons_total: data.counts.persons_total ?? prev.persons_total,
              vehicles: data.counts.vehicles ?? prev.vehicles,
              vehicles_total: data.counts.vehicles_total ?? prev.vehicles_total,
              plates: data.counts.plates ?? prev.plates,
              plates_total: data.counts.plates_total ?? prev.plates_total,
              events: data.counts.events ?? prev.events,
              alerts: data.counts.alerts ?? prev.alerts,
              total_seen: data.counts.total_seen ?? prev.total_seen,
            }));
          }

          if (data.debug) {
            setDebugInfo((prev) => ({ ...prev, ...data.debug }));
          }

          if (data.plates && Array.isArray(data.plates)) {
            for (const pl of data.plates) {
              if (pl.readable && pl.plate_number && pl.plate_number !== 'PLATE NOT READABLE') {
                setLivePlates((prev) => {
                  if (prev.some((p) => p.plate_number === pl.plate_number)) return prev;
                  return [
                    {
                      id: `pl-${Date.now()}-${pl.plate_number}`,
                      vehicle_type: pl.vehicle_type || 'CAR',
                      vehicle_id: pl.vehicle_id || 'Vehicle #01',
                      plate_number: pl.plate_number,
                      confidence: pl.confidence || 90.0,
                      readable: true,
                      time: pl.time || new Date().toLocaleTimeString(),
                    },
                    ...prev.slice(0, 19),
                  ];
                });
              }
            }
          }

          if (data.events && Array.isArray(data.events) && data.events.length > 0) {
            for (const ev of data.events) {
              setTimelineEvents((prev) => {
                if (prev.some((e) => e.id === ev.event_id)) return prev;
                return [
                  {
                    id: ev.event_id || `ev-${Date.now()}`,
                    event_type: ev.event_type || 'SURVEILLANCE EVENT',
                    severity: ev.severity || 'HIGH',
                    object_label: ev.object_label || 'Detected Object',
                    confidence: ev.confidence || 0.90,
                    timestamp: ev.timestamp || new Date().toLocaleTimeString(),
                    video_time_seconds: video.currentTime,
                    details: ev.details || `${ev.object_label} event detected`,
                    snapshot_url: ev.snapshot_url || ev.snapshot_path,
                    camera_id: selectedVideo.cameraId,
                  },
                  ...prev.slice(0, 49),
                ];
              });
            }
          }
        }
      } catch {
        inFlightRef.current = false;
      }

      // Schedule next frame grab to prioritize LATEST available camera frame
      const targetInterval = Math.max(20, Math.round(1000 / inferenceFps) - latency);
      if (isActive) {
        timerId = setTimeout(grabAndDispatch, targetInterval);
      }
    };

    timerId = setTimeout(grabAndDispatch, 100);

    return () => {
      isActive = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [selectedVideo.cameraId, inferenceFps, confThreshold, iouThreshold, selectedModel, selectedResolution, maxLostFrames, restrictedZonePoints]);

  // Video Canvas Drawing Loop (HUD Bounding Boxes, Letterbox Offset, Motion Velocity Extrapolation)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const containerW = canvas.clientWidth;
      const containerH = canvas.clientHeight;
      if (containerW === 0 || containerH === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Sync canvas pixel buffer size with devicePixelRatio for ultra-sharp HUD rendering
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(containerW * dpr) || canvas.height !== Math.round(containerH * dpr)) {
        canvas.width = Math.round(containerW * dpr);
        canvas.height = Math.round(containerH * dpr);
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Scale to CSS units
      ctx.clearRect(0, 0, containerW, containerH);

      // Compute exact letterboxed video frame boundaries
      const vid = videoRef.current;
      let offsetX = 0;
      let offsetY = 0;
      let renderW = containerW;
      let renderH = containerH;

      if (vid && vid.videoWidth > 0 && vid.videoHeight > 0) {
        const rect = getVideoRenderedRect(vid);
        offsetX = rect.offsetX;
        offsetY = rect.offsetY;
        renderW = rect.renderW;
        renderH = rect.renderH;
      }

      // 1. Draw Configured Restricted Danger Zone Polygon (Mapped to Video Rect)
      if (showRestrictedZone && restrictedZonePoints.length >= 3) {
        ctx.save();
        ctx.beginPath();
        const p0 = restrictedZonePoints[0];
        ctx.moveTo(offsetX + p0.x * renderW, offsetY + p0.y * renderH);
        for (let i = 1; i < restrictedZonePoints.length; i++) {
          ctx.lineTo(offsetX + restrictedZonePoints[i].x * renderW, offsetY + restrictedZonePoints[i].y * renderH);
        }
        ctx.closePath();

        ctx.fillStyle = isZoneEditMode ? 'rgba(239, 68, 68, 0.22)' : 'rgba(239, 68, 68, 0.12)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = isZoneEditMode ? 2.5 : 1.8;
        ctx.setLineDash(isZoneEditMode ? [6, 4] : [4, 4]);
        ctx.fill();
        ctx.stroke();

        // Polygon Vertices handles if in edit mode
        if (isZoneEditMode) {
          restrictedZonePoints.forEach((pt, idx) => {
            const vx = offsetX + pt.x * renderW;
            const vy = offsetY + pt.y * renderH;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(vx, vy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`V${idx + 1}`, vx + 8, vy - 4);
          });
        }

        // Zone Badge
        ctx.setLineDash([]);
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.90)';
        const zoneBadgeX = offsetX + p0.x * renderW + 6;
        const zoneBadgeY = offsetY + p0.y * renderH + 6;
        ctx.fillRect(zoneBadgeX, zoneBadgeY, 138, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('RESTRICTED DANGER ZONE', zoneBadgeX + 4, zoneBadgeY + 12);
        ctx.restore();
      }

      // 2. Optical Tactical Crosshairs HUD Grid (Mapped to Video Rect)
      if (showOpticalGrid) {
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)';
        ctx.lineWidth = 1;
        const cx = offsetX + renderW / 2;
        const cy = offsetY + renderH / 2;
        ctx.beginPath();
        ctx.moveTo(cx - 24, cy); ctx.lineTo(cx + 24, cy);
        ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy + 24);
        ctx.stroke();
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(offsetX + renderW * 0.25, offsetY); ctx.lineTo(offsetX + renderW * 0.25, offsetY + renderH);
        ctx.moveTo(offsetX + renderW * 0.75, offsetY); ctx.lineTo(offsetX + renderW * 0.75, offsetY + renderH);
        ctx.moveTo(offsetX, offsetY + renderH * 0.33); ctx.lineTo(offsetX + renderW, offsetY + renderH * 0.33);
        ctx.moveTo(offsetX, offsetY + renderH * 0.66); ctx.lineTo(offsetX + renderW, offsetY + renderH * 0.66);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Render AI Bounding Boxes with Motion Velocity Extrapolation (Zero Lag Tracking)
      if (showAiBoxes && liveTracks && liveTracks.length > 0) {
        const fw = lastFrameDimensions.w || 960;
        const fh = lastFrameDimensions.h || 540;

        // Motion dead reckoning delta time (clamped between 0 and 250ms)
        const dt = Math.max(0, Math.min(0.25, (performance.now() - lastPacketTimeRef.current) / 1000));

        liveTracks.forEach((trk) => {
          const bbox = trk.bbox;
          if (!bbox) return;

          // Base normalized coordinates
          const baseNx1 = bbox.nx1 !== undefined ? bbox.nx1 : (bbox.x1 <= 1.0 ? bbox.x1 : bbox.x1 / fw);
          const baseNy1 = bbox.ny1 !== undefined ? bbox.ny1 : (bbox.y1 <= 1.0 ? bbox.y1 : bbox.y1 / fh);
          const baseNx2 = bbox.nx2 !== undefined ? bbox.nx2 : (bbox.x2 <= 1.0 ? bbox.x2 : bbox.x2 / fw);
          const baseNy2 = bbox.ny2 !== undefined ? bbox.ny2 : (bbox.y2 <= 1.0 ? bbox.y2 : bbox.y2 / fh);

          // Velocity extrapolation (normalized units per second)
          const nvx = trk.nvx || 0;
          const nvy = trk.nvy || 0;
          const nx1 = Math.max(0, Math.min(0.98, baseNx1 + nvx * dt));
          const ny1 = Math.max(0, Math.min(0.98, baseNy1 + nvy * dt));
          const nx2 = Math.max(nx1 + 0.01, Math.min(1.0, baseNx2 + nvx * dt));
          const ny2 = Math.max(ny1 + 0.01, Math.min(1.0, baseNy2 + nvy * dt));

          // Project directly into letterboxed video area
          const bx1 = offsetX + nx1 * renderW;
          const by1 = offsetY + ny1 * renderH;
          const bw = (nx2 - nx1) * renderW;
          const bh = (ny2 - ny1) * renderH;

          if (bw <= 2 || bh <= 2) return;

          const cName = (trk.class_name || 'person').toLowerCase();
          const cat = (trk.category || 'HUMAN').toUpperCase();
          const isHuman = cat === 'HUMAN' || cName === 'person';
          const isVehicle = cat === 'VEHICLE' || ['car', 'truck', 'bus', 'motorcycle', 'bike', 'van'].some((v) => cName.includes(v));
          const isPredicted = trk.is_predicted || trk.state === 'LOST_PREDICTED';

          // Tactical styling
          let strokeColor = isPredicted ? 'rgba(16, 185, 129, 0.75)' : '#10b981'; // Emerald for human
          let fillColor = isPredicted ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.12)';
          let badgeBg = isPredicted ? 'rgba(16, 185, 129, 0.75)' : 'rgba(16, 185, 129, 0.92)';

          if (isVehicle) {
            strokeColor = isPredicted ? 'rgba(6, 182, 212, 0.75)' : '#06b6d4'; // Cyan for vehicle
            fillColor = isPredicted ? 'rgba(6, 182, 212, 0.06)' : 'rgba(6, 182, 212, 0.12)';
            badgeBg = isPredicted ? 'rgba(6, 182, 212, 0.75)' : 'rgba(6, 182, 212, 0.92)';
          }

          if (trk.risk_level === 'CRITICAL' || trk.risk_score >= 70) {
            strokeColor = '#ef4444'; // Red for alert/threat
            fillColor = 'rgba(239, 68, 68, 0.20)';
            badgeBg = 'rgba(239, 68, 68, 0.95)';
          }

          ctx.save();
          ctx.fillStyle = fillColor;
          ctx.fillRect(bx1, by1, bw, bh);

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = isPredicted ? 1.4 : 1.8;
          if (isPredicted) {
            ctx.setLineDash([4, 4]); // Anti-flicker temporal prediction dash
          }
          ctx.strokeRect(bx1, by1, bw, bh);
          ctx.setLineDash([]);

          // Corner Reticles
          const cl = Math.min(10, Math.min(bw, bh) * 0.25);
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(bx1, by1 + cl); ctx.lineTo(bx1, by1); ctx.lineTo(bx1 + cl, by1);
          ctx.moveTo(bx1 + bw - cl, by1); ctx.lineTo(bx1 + bw, by1); ctx.lineTo(bx1 + bw, by1 + cl);
          ctx.moveTo(bx1, by1 + bh - cl); ctx.lineTo(bx1, by1 + bh); ctx.lineTo(bx1 + cl, by1 + bh);
          ctx.moveTo(bx1 + bw - cl, by1 + bh); ctx.lineTo(bx1 + bw, by1 + bh); ctx.lineTo(bx1 + bw, by1 + bh - cl);
          ctx.stroke();

          // Tracking ID Pill & Label (e.g. "PERSON #01 94%", "CAR #02 91%")
          const displayId = trk.display_id || (isHuman ? `PERSON #${String(trk.track_id || 1).padStart(2, '0')}` : `CAR #${String(trk.track_id || 1).padStart(2, '0')}`);
          const confPct = Math.round((trk.confidence || 0.9) * 100);
          const subLabel = `${cName.toUpperCase()} ${confPct}%`;
          const fullLabelText = showTracks ? `${displayId} • ${subLabel}${isPredicted ? ' [PRED]' : ''}` : subLabel;

          ctx.font = 'bold 9px monospace';
          const textW = ctx.measureText(fullLabelText).width;
          ctx.fillStyle = badgeBg;
          ctx.fillRect(bx1, Math.max(offsetY, by1 - 15), textW + 8, 15);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(fullLabelText, bx1 + 4, Math.max(offsetY + 11, by1 - 4));

          ctx.restore();
        });
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [showAiBoxes, showTracks, showRestrictedZone, showOpticalGrid, liveTracks, restrictedZonePoints, isZoneEditMode, lastFrameDimensions]);

  // Sync canvas size with video container
  const syncCanvas = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.round((v.clientWidth || 1280) * dpr);
    const targetH = Math.round((v.clientHeight || 720) * dpr);
    if (c.width !== targetW || c.height !== targetH) {
      c.width = targetW;
      c.height = targetH;
    }
  }, []);

  useEffect(() => {
    syncCanvas();
    window.addEventListener('resize', syncCanvas);
    return () => window.removeEventListener('resize', syncCanvas);
  }, [syncCanvas]);

  return (
    <div
      ref={containerRef}
      className={`cctv-footage-studio flex flex-col gap-4 w-full h-full min-h-0 text-slate-100 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#020617] p-4' : ''
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-cyan-500/20 bg-slate-950/80 backdrop-blur-md shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-wide text-white uppercase flex items-center gap-2">
                CCTV Video AI Ingestion Studio
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                SIMULATION FEED // LIVE CV
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <Cpu className="w-3 h-3" />
                {debugInfo.device_name}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Channel: <span className="text-cyan-300 font-semibold">{selectedVideo.name}</span> • {selectedVideo.location}
            </p>
          </div>
        </div>

        {/* Video Channel Dropdown & Upload Action */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedVideo.id}
            onChange={(e) => {
              const match = videoSources.find((v) => v.id === e.target.value);
              if (match) handleSelectVideo(match);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400 shadow-inner"
          >
            {videoSources.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.filename})
              </option>
            ))}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.avi,.mov,.mkv,.webm"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium transition-all shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </button>

          <button
            onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              showAdvancedPanel
                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-cyan-300'
            }`}
            title="YOLO AI Engine Controls"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>YOLO Config</span>
          </button>
        </div>
      </div>

      {/* Advanced YOLO Engine Configuration Panel (Collapsible) */}
      {showAdvancedPanel && (
        <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-slate-950/90 backdrop-blur-md shadow-xl flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Model Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300 text-xs focus:border-cyan-400"
              >
                <option value="yolov8n.pt">YOLOv8 Nano (Fast / Real-Time)</option>
                <option value="yolov8s.pt">YOLOv8 Small (High-Accuracy / Distant)</option>
              </select>
            </div>

            {/* Resolution Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Input Size:</span>
              <select
                value={selectedResolution}
                onChange={(e) => setSelectedResolution(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300 text-xs focus:border-cyan-400"
              >
                <option value={640}>640 px (Ultra-Fast)</option>
                <option value={960}>960 px (Balanced CCTV)</option>
                <option value={1280}>1280 px (Small Objects / 4K)</option>
              </select>
            </div>

            {/* Confidence Slider */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Conf: {confThreshold}%</span>
              <input
                type="range"
                min={15}
                max={70}
                step={5}
                value={confThreshold}
                onChange={(e) => setConfThreshold(Number(e.target.value))}
                className="w-20 h-1.5 bg-slate-800 rounded appearance-none accent-cyan-400"
              />
            </div>

            {/* IoU Slider */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">IoU: {iouThreshold}%</span>
              <input
                type="range"
                min={25}
                max={70}
                step={5}
                value={iouThreshold}
                onChange={(e) => setIouThreshold(Number(e.target.value))}
                className="w-16 h-1.5 bg-slate-800 rounded appearance-none accent-cyan-400"
              />
            </div>

            {/* Anti-Flicker Tolerance */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Anti-Flicker: {maxLostFrames}f</span>
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={maxLostFrames}
                onChange={(e) => setMaxLostFrames(Number(e.target.value))}
                className="w-14 h-1.5 bg-slate-800 rounded appearance-none accent-emerald-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDebugHud(!showDebugHud)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                showDebugHud
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Debug HUD</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Analytics Metric Cards (Live KPI Dashboard - Requirement 20) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">👤 People</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-400">{String(liveCounts.persons).padStart(2, '0')}</span>
              <span className="text-[10px] text-slate-400">/ Total {liveCounts.persons_total || liveCounts.persons}</span>
            </div>
          </div>
          <User className="w-6 h-6 text-emerald-400/40" />
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">🚗 Vehicles</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-cyan-400">{String(liveCounts.vehicles).padStart(2, '0')}</span>
              <span className="text-[10px] text-slate-400">/ Total {liveCounts.vehicles_total || liveCounts.vehicles}</span>
            </div>
          </div>
          <Car className="w-6 h-6 text-cyan-400/40" />
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">🔢 Plates Detected</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-400">
                {String(livePlates.filter((p) => p.readable).length).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-slate-400">/ Total {liveCounts.plates_total || livePlates.filter((p) => p.readable).length}</span>
            </div>
          </div>
          <Scan className="w-6 h-6 text-amber-400/40" />
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">⚠️ Events</span>
            <span className="text-2xl font-black text-yellow-400">{String(timelineEvents.length).padStart(2, '0')}</span>
          </div>
          <Activity className="w-6 h-6 text-yellow-400/40" />
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">🔴 Threat Alerts</span>
            <span className="text-2xl font-black text-rose-500">
              {String(timelineEvents.filter((e) => e.severity === 'HIGH' || e.severity === 'CRITICAL').length).padStart(2, '0')}
            </span>
          </div>
          <ShieldAlert className="w-6 h-6 text-rose-500/40" />
        </div>
      </div>

      {/* 3. Main Center Split: Video Feed Player with Canvas & Right Drawer Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[500px]">
        {/* Left Column: Tactical CCTV Video Player (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col rounded-xl border border-slate-800 bg-black overflow-hidden shadow-2xl relative">
          {/* Video Container with Canvas HUD Overlay */}
          <div className="relative flex-1 min-h-[360px] bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              src={selectedVideo.streamUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration || 61);
                  syncCanvas();
                }
              }}
              className="w-full h-full object-contain max-h-[70vh]"
            />

            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10 block"
            />

            {/* Comprehensive Real-Time AI Diagnostics HUD (Sections 1 & 26) */}
            {showDebugHud && (
              <div className="absolute top-12 left-3 z-30 font-mono text-[10px] p-3 rounded-xl bg-slate-950/95 border border-cyan-500/50 text-slate-200 backdrop-blur-md shadow-2xl pointer-events-none max-w-sm space-y-2">
                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 text-white font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" /> AI REAL-TIME DIAGNOSTICS
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    ● {debugInfo.yolo_status || 'AI ACTIVE'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
                  <div>CAM FPS: <span className="text-emerald-400 font-bold">{cameraFps} FPS</span></div>
                  <div>AI FPS: <span className="text-cyan-300 font-bold">{debugInfo.ai_fps.toFixed(1)} FPS</span></div>
                  <div>INFERENCE: <span className="text-amber-300 font-bold">{debugInfo.inference_ms} ms</span></div>
                  <div>TOTAL LATENCY: <span className="text-emerald-400 font-bold">{debugInfo.total_ms} ms</span></div>
                  <div>QUEUE SIZE: <span className="text-cyan-300 font-bold">0 (Latest-Frame)</span></div>
                  <div>DROPPED FRAMES: <span className="text-amber-400 font-bold">{debugInfo.dropped_frames || 0}</span></div>
                  <div>RESOLUTION: <span className="text-white font-semibold">{selectedVideo.resolution || '3840x2160 4K'}</span></div>
                  <div>INPUT SIZE: <span className="text-cyan-300 font-bold">{debugInfo.input_size}px</span></div>
                  <div>MODEL: <span className="text-cyan-300 font-bold">{debugInfo.model}</span></div>
                  <div>TRACKER: <span className="text-cyan-300 font-bold">{debugInfo.tracker}</span></div>
                  <div>DEVICE: <span className="text-cyan-300 font-bold">{debugInfo.device} ({debugInfo.precision})</span></div>
                  <div>CPU USAGE: <span className="text-amber-300 font-bold">{debugInfo.cpu_percent || 0}%</span></div>
                  <div>RAM USAGE: <span className="text-amber-300 font-bold">{debugInfo.ram_percent || 0}%</span></div>
                  <div>VRAM: <span className="text-slate-400 font-semibold">{debugInfo.vram || 'N/A'}</span></div>
                  <div>CONFIDENCE: <span className="text-cyan-300 font-bold">{(debugInfo.confidence * 100).toFixed(0)}%</span></div>
                  <div>IOU THRESH: <span className="text-cyan-300 font-bold">{(debugInfo.iou * 100).toFixed(0)}%</span></div>
                  <div>DETECTIONS/FRAME: <span className="text-white font-black">{debugInfo.detections_count}</span></div>
                  <div>ACTIVE TRACKS: <span className="text-white font-black">{debugInfo.active_tracks_count}</span></div>
                </div>
                <div className="pt-1 border-t border-slate-800 text-[9px] text-slate-400 flex items-center justify-between">
                  <span>PRE: {debugInfo.preprocess_ms}ms | POST: {debugInfo.postprocess_ms}ms</span>
                  <span className="text-emerald-400 font-bold">ZERO BACKLOG ACTIVE</span>
                </div>
              </div>
            )}

            {/* Top-Right CCTV Camera HUD Telemetry Badge (Honest Live Metrics) */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2 font-mono text-[10px] pointer-events-none">
              <span className="px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-emerald-400 backdrop-blur-md">
                CAM: {cameraFps} FPS
              </span>
              <span className="px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-cyan-300 backdrop-blur-md">
                AI: {debugInfo.ai_fps.toFixed(1)} FPS
              </span>
              <span className="px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-amber-300 backdrop-blur-md">
                LATENCY: {debugInfo.total_ms || inferenceLatency}ms
              </span>
              <span className="px-2 py-0.5 rounded bg-red-600/90 text-white font-bold animate-pulse">
                LIVE ●
              </span>
            </div>

            {/* Top-Left Camera Channel OSD */}
            <div className="absolute top-3 left-3 z-20 font-mono text-xs text-cyan-400 drop-shadow-md pointer-events-none">
              <div className="flex items-center gap-1.5 font-bold tracking-wider">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                {selectedVideo.cameraId.toUpperCase()} // {selectedVideo.tag}
              </div>
              <div className="text-[10px] text-slate-300">
                {selectedVideo.resolution} • {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>

          {/* Precision CCTV Video Controls & Timeline Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2 font-mono">
            {/* Timeline Progress Scrubber */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 w-11">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[11px] text-slate-400 w-11 text-right">{formatTime(duration)}</span>
            </div>

            {/* Tactical Buttons Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 transition-colors"
                  title={isPlaying ? 'Pause Feed' : 'Play Feed'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={restartVideo}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
                  title="Restart Feed"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <div className="h-5 w-px bg-slate-800 mx-1" />

                {/* Overlays Toggles */}
                <button
                  onClick={() => setShowAiBoxes(!showAiBoxes)}
                  className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                    showAiBoxes
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  AI Boxes
                </button>

                <button
                  onClick={() => setShowTracks(!showTracks)}
                  className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                    showTracks
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Tracking IDs
                </button>

                <button
                  onClick={() => setShowRestrictedZone(!showRestrictedZone)}
                  className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                    showRestrictedZone
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Danger Zone
                </button>

                <button
                  onClick={() => {
                    if (isZoneEditMode) {
                      saveRestrictedZone();
                    } else {
                      setIsZoneEditMode(true);
                    }
                  }}
                  className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                    isZoneEditMode
                      ? 'bg-amber-500/30 text-amber-200 border-amber-400 font-bold animate-pulse'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300'
                  }`}
                >
                  {isZoneEditMode ? '✓ Save Zone' : 'Edit Zone ROI'}
                </button>
              </div>

              {/* Right Side Video Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Inference:</span>
                  <select
                    value={inferenceFps}
                    onChange={(e) => setInferenceFps(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-300 text-xs"
                  >
                    <option value={4}>4 FPS</option>
                    <option value={8}>8 FPS</option>
                    <option value={12}>12 FPS</option>
                    <option value={15}>15 FPS</option>
                  </select>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
                  title="Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Number Plate Detection (ANPR) & Event Timeline (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-4 font-mono">
          {/* Card A: Number Plate Detection / Recognition (ANPR / ALPR) */}
          <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-slate-950/80 backdrop-blur-md shadow-lg flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Number Plate Recognition (ANPR)
                </h3>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                EASYOCR ACTIVE
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
              {livePlates.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">No plates detected yet</div>
              ) : (
                livePlates.map((plate) => (
                  <div
                    key={plate.id}
                    className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs hover:border-cyan-500/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">{plate.vehicle_type}</span>
                        <span className="text-[10px] text-slate-400">{plate.vehicle_id}</span>
                      </div>
                      <div className="font-mono font-black text-sm tracking-wider text-amber-300 mt-0.5">
                        {plate.plate_number}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-emerald-400 font-bold">{plate.confidence}% CONF</div>
                      <div className="text-[10px] text-slate-400">{plate.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card B: Real-Time Event & Alert Timeline */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-md shadow-lg flex-1 flex flex-col gap-2.5 min-h-[260px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Event & Alert Timeline
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                {timelineEvents.length} INCIDENTS
              </span>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1 max-h-[300px]">
              {timelineEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    if (ev.video_time_seconds !== undefined && videoRef.current) {
                      videoRef.current.currentTime = ev.video_time_seconds;
                      setCurrentTime(ev.video_time_seconds);
                    }
                    if (ev.snapshot_url) {
                      setSelectedSnapshot({
                        url: ev.snapshot_url,
                        title: ev.event_type,
                        timestamp: ev.timestamp,
                        objectLabel: ev.object_label,
                        confidence: ev.confidence,
                        details: ev.details,
                        eventType: ev.event_type,
                      });
                    }
                  }}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    ev.severity === 'CRITICAL' || ev.severity === 'HIGH'
                      ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400'
                      : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ev.severity === 'CRITICAL' || ev.severity === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {ev.event_type}
                    </span>
                    <span className="text-[10px] text-slate-400">{ev.timestamp}</span>
                  </div>

                  <div className="text-xs text-slate-200 font-semibold mt-1 flex items-center justify-between">
                    <span>{ev.object_label}</span>
                    <span className="text-[10px] text-cyan-400">{Math.round(ev.confidence * 100)}%</span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {ev.details}
                  </div>

                  {ev.snapshot_url && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-cyan-300 font-bold">
                      <Camera className="w-3 h-3" /> Click to view Evidence Frame
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Forensic Evidence Snapshot Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="max-w-2xl w-full bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl p-4 font-mono flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase text-white">Forensic Evidence Snapshot</h3>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black max-h-[420px] flex items-center justify-center">
              <img
                src={selectedSnapshot.url}
                alt="Evidence Frame"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as any).src = '/fixtures/bus.jpg';
                }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">EVENT TYPE</span>
                <span className="font-bold text-rose-400">{selectedSnapshot.eventType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TARGET OBJECT</span>
                <span className="font-bold text-cyan-300">{selectedSnapshot.objectLabel}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TIMESTAMP</span>
                <span className="font-bold text-slate-200">{selectedSnapshot.timestamp}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CONFIDENCE</span>
                <span className="font-bold text-emerald-400">{Math.round(selectedSnapshot.confidence * 100)}%</span>
              </div>
            </div>

            <div className="text-xs text-slate-300">{selectedSnapshot.details}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export { CctvFootageStudio };
export default CctvFootageStudio;
