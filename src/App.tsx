import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { ViewMode, AlertItem, CameraFeed, MatrixCameraFeed, DefconLevel } from './types';
import {
  Sidebar,
  Header,
  TacticalCommandDashboard,
  KpiCards,
  SystemGauges,
  TacticalMatrixView,
  MultiCamStitchingView,
  QuadLiveStreamView,
  DetectionsView,
  AlertsManagementView,
  AlertsLog,
  SettingsView,
  UserManagementView,
  AlertDetailModal,
  CameraDetailModal,

  AnalyticsDashboard,
  IncidentInspectorView,
  IntelligenceSearch,
  TargetJourneyView,
  ThreatHeatmapView,
  HistoricalLogsView,
  NotificationHistory,
  CameraHealthDiagnosticsView,
  MissionControlView,
  CameraFleetView,
  EvidenceQueueView,
  SystemTimelineView,
  CameraCalibrationView,
  ReportsModal,
  TacticalRadarGisView,
  DefenseSandboxView,
  MultiAgentOrchestratorView,
  SwarmHelpModal,
  HelpBotWidget,
  ScreenLockOverlay,
  PinConfigModal,
  ProfileModal,
  LandingPage,
  Auth3DView,
  TacticalOperationsAtmosphere,
  CctvFootageStudio,
} from './components';

import {
  initialAlerts,
  initialCameras,
  initialMatrixCameras,
  initialTelemetry,
  initialDetections,
} from './data/mockData';
import { audioAlertEngine, triggerIntrusionAudioAlert, tacticalAlertDispatcher } from './utils';
import { webSocketService, voiceCommandService, fetchAlerts, fetchCameras, fetchTelemetry } from './services';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SecurityProvider } from './context/SecurityContext';
import { Siren, ShieldAlert, AlertTriangle } from 'lucide-react';

function SeemadrishtiMainApp() {
  const { theme, isDaylight } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const rawPath = location.pathname.substring(1).toLowerCase();

  const ROUTE_ALIASES: Record<string, ViewMode> = {
    notifications: 'notification-history',
    'notification-history': 'notification-history',
    radar: 'radar-map',
    gis: 'radar-map',
    'radar-map': 'radar-map',
    swarm: 'agents',
    agent: 'agents',
    agents: 'agents',
    vault: 'evidence-queue',
    evidence: 'evidence-queue',
    'evidence-queue': 'evidence-queue',
    timeline: 'system-timeline',
    'system-timeline': 'system-timeline',
    nvr: 'historical-logs',
    logs: 'historical-logs',
    'historical-logs': 'historical-logs',
    matrix: 'dashboard',
    dashboard: 'dashboard',
    terminal: 'dashboard',
    cctv: 'cctv-footage',
    footage: 'cctv-footage',
    'cctv-footage': 'cctv-footage',
  };

  const currentView: ViewMode = (ROUTE_ALIASES[rawPath] || rawPath || 'dashboard') as ViewMode;

  const setCurrentView = useCallback((view: string) => {
    navigate(`/${view}`);
  }, [navigate]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAudioPingActive, setIsAudioPingActive] = useState(false);
  const [audioVolume, setAudioVolume] = useState(85);

  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isSwarmHelpOpen, setIsSwarmHelpOpen] = useState(false);

  // App Data States
  const [cameras, setCameras] = useState<CameraFeed[]>(() => {
    const fixtures = [
      '/fixtures/moving_objects.mp4',
      '/fixtures/intrusion_test.mp4',
      '/fixtures/loitering_test.mp4',
      '/fixtures/sample_test.mp4',
    ];
    return initialCameras.map((cam, i) => ({
      ...cam,
      rtspUrl: fixtures[i % fixtures.length],
    }));
  });
  const [matrixCameras, setMatrixCameras] = useState<MatrixCameraFeed[]>(() => {
    const fixtures = [
      '/fixtures/moving_objects.mp4',
      '/fixtures/intrusion_test.mp4',
      '/fixtures/loitering_test.mp4',
      '/fixtures/sample_test.mp4',
    ];
    return initialMatrixCameras.map((cam, i) => ({
      ...cam,
      src: fixtures[i % fixtures.length],
    }));
  });
  const [selectedCameraId, setSelectedCameraId] = useState<string>('cam-1');
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [isGlobalFlashActive, setIsGlobalFlashActive] = useState(false);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<AlertItem | null>(null);
  const [selectedCameraForModal, setSelectedCameraForModal] = useState<CameraFeed | null>(null);
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(85);
  const [highlightedCameras, setHighlightedCameras] = useState<string[]>([]);
  const [selectedJourneyTrackId, setSelectedJourneyTrackId] = useState<number | null>(null);
  const [heatmapHighlightCameras, setHeatmapHighlightCameras] = useState<string[]>([]);
  const [spotlightCameraOverride, setSpotlightCameraOverride] = useState<number | null>(null);
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [defconLevel, setDefconLevel] = useState<DefconLevel>(() => {
    try {
      const saved = localStorage.getItem('seemadrishti_defcon_level');
      if (saved && [1, 2, 3, 4, 5].includes(Number(saved))) {
        return Number(saved) as DefconLevel;
      }
    } catch {}
    return 4;
  });

  const handleSetDefconLevel = (level: DefconLevel) => {
    setDefconLevel(level);
    try {
      localStorage.setItem('seemadrishti_defcon_level', String(level));
    } catch {}
  };

  // Dynamic Camera Name Renaming Handler
  const handleUpdateCameraName = (id: number, newName: string) => {
    setMatrixCameras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: newName } : c))
    );
  };

  // Dynamic Camera Video Source Handler (Uploads or Custom URLs)
  const handleUpdateCameraSource = (id: number, newSrc: string, customName?: string) => {
    setMatrixCameras((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              src: newSrc,
              location: customName ? `${c.location} (${customName})` : c.location,
            }
          : c
      )
    );
  };

  const handleBatchUpdateSources = (
    updates: { id: number; src: string; customName?: string }[]
  ) => {
    setMatrixCameras((prev) =>
      prev.map((c) => {
        const match = updates.find((u) => u.id === c.id);
        return match
          ? {
              ...c,
              src: match.src,
              location: match.customName ? `${c.location} (${match.customName})` : c.location,
            }
          : c;
      })
    );
  };
  
  // Anomaly Sensitivity & Trajectory Settings
  const [anomalySensitivity, setAnomalySensitivity] = useState<number>(78);
  const [trajectoryDataset, setTrajectoryDataset] = useState<string>(
    'Standard Tactical Sector Movement Model (Operational Baseline)'
  );
  const [showTrajectoryVectors, setShowTrajectoryVectors] = useState<boolean>(true);

  // Trigger Flash Animation Helper
  const triggerGlobalFlash = useCallback(() => {
    setIsGlobalFlashActive(true);
    setTimeout(() => {
      setIsGlobalFlashActive(false);
    }, 4500);
  }, []);

  // WebSocket Live Stream Service Integration
  useEffect(() => {
    webSocketService.connect();

    // Fetch initial alerts from database REST API
    fetchAlerts()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          const mappedAlerts: AlertItem[] = res.data.map((a: any) => {
            const meta = typeof a.metadata === 'object' && a.metadata !== null ? a.metadata : {};
            const d = new Date(a.created_at || Date.now());
            const sev: AlertItem['severity'] =
              a.severity === 'CRITICAL' || a.severity === 'HIGH' || a.severity === 'High'
                ? 'High'
                : a.severity === 'MEDIUM' || a.severity === 'Medium'
                ? 'Medium'
                : 'Low';
            return {
              id: a.id,
              title: a.title || 'Security Anomaly',
              camera: a.camera_id?.toUpperCase() || 'CAM-01',
              severity: sev,
              time: isNaN(d.getTime()) ? '00:00:00' : d.toLocaleTimeString(),
              type: a.type || 'PERIMETER_ALERT',
              timestamp: isNaN(d.getTime()) ? Date.now() : d.getTime(),
              status: a.status || 'active',
              description: a.description || '',
              location: a.location || 'Border Sector Alpha',
              riskScore: a.risk_score ?? meta.risk_score,
              riskLevel: a.risk_level ?? meta.risk_level,
              reasons: meta.reasons,
              trackId: a.track_id ?? meta.track_id,
              className: meta.class_name,
              hasEvidence: Boolean(meta.evidence_path || a.has_evidence),
              incidentId: meta.incident_id || a.incident_id,
              cameraSequence: meta.camera_sequence,
              anomalyType: meta.anomaly_type,
              dwellSeconds: meta.dwell_seconds,
              zoneName: a.zone_name || meta.zone_name,
            };
          });
          setAlerts(mappedAlerts);
        }
      })
      .catch(() => {});

    // Fetch initial Edge Hardware & Database Telemetry
    fetchTelemetry()
      .then((res) => {
        if (res.success && res.data) {
          const hw = res.data.hardware;
          setTelemetry((prev) => ({
            ...prev,
            cpuUsage: hw.loadAverage?.[0] ? Math.round(hw.loadAverage[0] * 10) : prev.cpuUsage,
            cpuLoad: `${hw.cpuCores}-Core (${hw.cpuModel})`,
            memoryUsedGb: hw.memoryUsedGb,
            memoryTotalGb: hw.memoryTotalGb,
            database: res.data.database,
          } as any));
        }
      })
      .catch(() => {});

    // Priority 2: Hydrate matrix cameras from live SQLite backend REST API
    fetchCameras()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setMatrixCameras((prev) =>
            prev.map((c) => {
              const camCode = `cam-0${c.id}`;
              const liveCam = res.data?.find(
                (dbCam) =>
                  dbCam.id.toLowerCase() === camCode ||
                  dbCam.id.toLowerCase() === `cam-${c.id}` ||
                  dbCam.name.toLowerCase() === c.name.toLowerCase()
              );
              if (liveCam) {
                return {
                  ...c,
                  name: liveCam.name || c.name,
                  location: liveCam.location || c.location,
                  status: liveCam.status || c.status,
                  src: liveCam.source_url ? `/api/cameras/${liveCam.id}/video` : c.src,
                };
              }
              return c;
            })
          );
        }
      })
      .catch((err) => {
        console.warn('[CAMERAS] Live fetch failed, using fallback mockData:', err);
      });

    // Ingest Live Stream Alerts from WebSocket Server
    const unsubAlerts = webSocketService.onAlert((incomingAlert) => {
      setAlerts((prev) => {
        // Prevent duplicate IDs
        if (prev.some((a) => a.id === incomingAlert.id)) return prev;
        return [incomingAlert, ...prev];
      });

      const sev = String(incomingAlert.severity || '').toLowerCase();
      if (sev === 'high' || sev === 'critical' || incomingAlert.audioTriggered) {
        triggerGlobalFlash();
        triggerIntrusionAudioAlert({
          ...incomingAlert,
          confidence: incomingAlert.confidence || 95,
        });
      }
    });

    // Ingest Live Telemetry updates from WebSocket Server
    const unsubTelemetry = webSocketService.onTelemetry((incomingTelemetry) => {
      setTelemetry((prev) => ({
        ...prev,
        ...incomingTelemetry,
      }));
    });

    const unsubWs = webSocketService.onStateChange((st) => {
      setIsBackendOffline(st.status === 'DISCONNECTED');
    });

    const unsubTactical = tacticalAlertDispatcher.subscribe((incomingAlert) => {
      setAlerts((prev) => {
        if (prev.some((a) => a.id === incomingAlert.id)) return prev;
        return [incomingAlert, ...prev];
      });
    });

    return () => {
      unsubAlerts();
      unsubTelemetry();
      unsubWs();
      unsubTactical();
    };
  }, [triggerGlobalFlash]);

  // Subscribe to Audio Alert Engine
  useEffect(() => {
    const unsubscribe = audioAlertEngine.subscribe((isPlaying) => {
      setIsAudioPingActive(isPlaying);
    });
    return unsubscribe;
  }, []);

  // Subscribe to Copilot Actions (Camera switching, View navigation)
  useEffect(() => {
    const handleCopilotAction = (e: any) => {
      const act = e.detail;
      if (!act) return;
      if (act.type === 'navigate_view' && act.target) {
        setCurrentView(act.target);
      } else if (act.type === 'open_camera') {
        setCurrentView('matrix');
      }
    };
    window.addEventListener('seemadrishti:action', handleCopilotAction);
    return () => window.removeEventListener('seemadrishti:action', handleCopilotAction);
  }, []);

  // Comprehensive Refresh handler across telemetry, alerts, cameras, and WebSocket gateway
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const startTime = Date.now();

    // Tactile acoustic confirmation on refresh
    try {
      audioAlertEngine.playSonarPing();
    } catch {}

    try {
      await Promise.allSettled([
        // 1. Hardware & System Telemetry
        fetchTelemetry().then((res) => {
          if (res.success && res.data) {
            const hw = res.data.hardware;
            setTelemetry((prev) => ({
              ...prev,
              cpuUsage: hw.loadAverage?.[0] ? Math.round(hw.loadAverage[0] * 10) : prev.cpuUsage,
              cpuLoad: `${hw.cpuCores}-Core (${hw.cpuModel})`,
              memoryUsedGb: hw.memoryUsedGb,
              memoryTotalGb: hw.memoryTotalGb,
              database: res.data.database,
            } as any));
          }
        }),

        // 2. Incident Alerts
        fetchAlerts().then((res) => {
          if (res.success && res.data && res.data.length > 0) {
            const mappedAlerts: AlertItem[] = res.data.map((a: any) => {
              const meta = typeof a.metadata === 'object' && a.metadata !== null ? a.metadata : {};
              const d = new Date(a.created_at || Date.now());
              const sev: AlertItem['severity'] =
                a.severity === 'CRITICAL' || a.severity === 'HIGH' || a.severity === 'High'
                  ? 'High'
                  : a.severity === 'MEDIUM' || a.severity === 'Medium'
                  ? 'Medium'
                  : 'Low';
              return {
                id: a.id,
                title: a.title || 'Security Anomaly',
                camera: a.camera_id?.toUpperCase() || 'CAM-01',
                severity: sev,
                time: isNaN(d.getTime()) ? '00:00:00' : d.toLocaleTimeString(),
                type: a.type || 'PERIMETER_ALERT',
                timestamp: isNaN(d.getTime()) ? Date.now() : d.getTime(),
                status: a.status || 'active',
                description: a.description || '',
                location: a.location || 'Border Sector Alpha',
                riskScore: a.risk_score ?? meta.risk_score,
                riskLevel: a.risk_level ?? meta.risk_level,
                reasons: meta.reasons,
                trackId: a.track_id ?? meta.track_id,
                className: meta.class_name,
                hasEvidence: Boolean(meta.evidence_path || a.has_evidence),
                incidentId: meta.incident_id || a.incident_id,
                cameraSequence: meta.camera_sequence,
                anomalyType: meta.anomaly_type,
                dwellSeconds: meta.dwell_seconds,
                zoneName: a.zone_name || meta.zone_name,
              };
            });
            setAlerts(mappedAlerts);
          }
        }),

        // 3. Camera Node Matrix
        fetchCameras().then((res) => {
          if (res.success && res.data && res.data.length > 0) {
            setMatrixCameras((prev) =>
              prev.map((c) => {
                const camCode = `cam-0${c.id}`;
                const liveCam = res.data?.find(
                  (dbCam) =>
                    dbCam.id.toLowerCase() === camCode ||
                    dbCam.id.toLowerCase() === `cam-${c.id}` ||
                    dbCam.name.toLowerCase() === c.name.toLowerCase()
                );
                if (liveCam) {
                  return {
                    ...c,
                    name: liveCam.name || c.name,
                    location: liveCam.location || c.location,
                    status: liveCam.status || c.status,
                    src: liveCam.source_url ? `/api/cameras/${liveCam.id}/video` : c.src,
                  };
                }
                return c;
              })
            );
          }
        }),
      ]);

      // Ensure all live HTML5 video feeds across the DOM continue active playback
      if (typeof document !== 'undefined') {
        document.querySelectorAll('video').forEach((vid) => {
          if (vid.paused && vid.readyState >= 2) {
            vid.play().catch(() => {});
          }
        });
      }

      // Reconnect WebSocket if disconnected
      if (webSocketService.getState().status === 'DISCONNECTED') {
        webSocketService.connect();
      }
    } catch (err) {
      console.warn('[REFRESH] Error during refresh:', err);
    } finally {
      // Smooth 600ms visual spin feedback
      const elapsed = Date.now() - startTime;
      if (elapsed < 600) {
        await new Promise((r) => setTimeout(r, 600 - elapsed));
      }
      setIsRefreshing(false);
    }
  };

  // Voice-to-Text Command Dispatcher Integration
  useEffect(() => {
    const unsub = voiceCommandService.onCommand((match) => {
      const act = match.action;
      if (act.type === 'NAVIGATE') {
        setCurrentView(act.view);
      } else if (act.type === 'SET_MATRIX_LAYOUT') {
        setCurrentView('dashboard');
      } else if (act.type === 'SIMULATE_INTRUSION') {
        handleSimulateIntrusion();
      } else if (act.type === 'MUTE_AUDIO') {
        setIsAudioMuted(act.muted);
        audioAlertEngine.setMuted(act.muted);

      } else if (act.type === 'OPEN_REPORTS') {
        setIsReportsModalOpen(true);
      } else if (act.type === 'REFRESH') {
        handleRefresh();
      }
    });
    return unsub;
  }, []);

  // Simulate Anomaly Intrusion
  const handleSimulateIntrusion = (cam?: MatrixCameraFeed) => {
    const d = new Date();
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const timeStr = `${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(
      2,
      '0'
    )}:${String(d.getSeconds()).padStart(2, '0')} ${ampm}`;

    const camTag = cam ? cam.tag : 'CAM-01';
    const camName = cam ? cam.name : 'Sector A - Perimeter Fence Line';

    const testConfidence = 0.95;
    const isHighSeverity = true;

    const newAlert: AlertItem = {
      id: `alt-${Date.now()}`,
      title: 'CRITICAL PERIMETER BREACH',
      camera: camTag,
      severity: 'High',
      time: timeStr,
      type: 'Perimeter Breach',
      timestamp: Date.now(),
      status: 'active',
      description: `Tactical barrier crossing detected on ${camName}. AI anomaly detection flagged trajectory crossing border perimeter.`,
      location: camName,
      confidence: testConfidence,
      assignedUnit: 'Border Patrol Squad Alpha',
      audioTriggered: testConfidence >= confidenceThreshold,
      thresholdAtTime: confidenceThreshold,
    };

    // Trigger global screen flash strobe if High severity
    if (isHighSeverity || newAlert.severity === 'High') {
      triggerGlobalFlash();
    }

    if (testConfidence >= confidenceThreshold) {
      triggerIntrusionAudioAlert(newAlert);
      setAlerts((prev) => [newAlert, ...prev]);
      setSelectedAlertForModal(newAlert);
    } else {
      console.log(`[AI FILTER] Alert suppressed. Confidence (${testConfidence}%) below threshold (${confidenceThreshold}%).`);
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  // Alert Actions
  const handleInitiateResponse = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'response_initiated' } : a))
    );
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'resolved' } : a))
    );
    if (selectedAlertForModal?.id === alertId) {
      setSelectedAlertForModal(null);
    }
  };

  return (
    <div
      id="seemadrishti-app-root"
      className={`h-screen h-[100dvh] max-h-screen max-h-[100dvh] flex flex-row overflow-hidden font-mono antialiased relative transition-colors duration-300 ${
        isDaylight
          ? 'bg-[#f1f5f9] text-slate-900 selection:bg-cyan-600 selection:text-white'
          : 'bg-[#02040a] text-slate-200 selection:bg-cyan-500 selection:text-black'
      } ${isGlobalFlashActive ? 'animate-screen-flash-pulse' : ''}`}
    >
      {/* Global Perimeter Alarm Visual Warning Overlay Banner */}
      {isGlobalFlashActive && (
        <div
          id="global-perimeter-alarm-banner"
          className="fixed top-0 left-0 right-0 z-50 bg-rose-600/90 text-white border-b-2 border-rose-400 py-1.5 px-4 flex items-center justify-between shadow-[0_0_30px_rgba(255,0,85,0.9)] animate-bounce font-mono text-xs font-black tracking-widest"
        >
          <div className="flex items-center gap-2">
            <Siren size={18} className="animate-spin text-white" />
            <span className="uppercase">
              CRITICAL DEFCON-1 PERIMETER INTRUSION DETECTED — TACTICAL ALARM ENGAGED
            </span>
          </div>
          <button
            onClick={() => setIsGlobalFlashActive(false)}
            className="px-2 py-0.5 rounded bg-black/40 hover:bg-black/70 text-white text-[10px] uppercase cursor-pointer"
          >
            DISMISS ALARM STROBE
          </button>
        </div>
      )}

      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        unreadAlertsCount={alerts.filter((a) => a.status === 'active').length}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-0 h-full max-h-full overflow-hidden relative transition-colors duration-300 ${
          isDaylight
            ? 'bg-[#f8fafc]'
            : theme === 'midnight-cyber'
            ? 'bg-[#030712]'
            : theme === 'obsidian-stealth'
            ? 'bg-[#000000]'
            : theme === 'emerald-ops'
            ? 'bg-[#021009]'
            : 'bg-[#060913]'
        }`}
      >
        {/* Subtle 3D Command-Center Background Atmosphere */}
        <TacticalOperationsAtmosphere />


        {/* 2. Top Header with Right Upper Corner Operator Profile */}
        <Header
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          activeAlertCount={alerts.length}

          onOpenSettings={() => setCurrentView('settings')}
          onOpenAlerts={() => setCurrentView('alerts')}
          onOpenSwarmHelp={() => setIsSwarmHelpOpen(true)}
        />


        {/* Real-time Backend Offline Indicator Banner */}
        {isBackendOffline && (
          <div className="shrink-0 flex-none bg-rose-950/95 border-b border-rose-500/60 px-4 py-2 flex items-center justify-between text-xs font-mono text-rose-200 z-30 shadow-[0_4px_20px_rgba(244,63,94,0.3)]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-400 shrink-0 animate-pulse" />
              <span>
                <strong>BACKEND OFFLINE:</strong> Real-time edge gateway disconnected. Displaying cached operational data. Reconnecting in background...
              </span>
            </div>
            <button
              onClick={handleRefresh}
              className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Dynamic Main Body by Current View */}
        <main className="flex-1 min-h-0 p-3.5 sm:p-5 overflow-y-auto space-y-5 relative z-10">
          {currentView === 'dashboard' && (
            <TacticalCommandDashboard
              alerts={alerts}
              onSelectAlert={(a) => setSelectedAlertForModal(a)}
              onNavigate={(view) => setCurrentView(view)}
            />
          )}

          {currentView === 'mission-control' && (
            <MissionControlView
              onNavigate={(view) => setCurrentView(view)}
              onOpenReports={() => setIsReportsModalOpen(true)}

            />
          )}

          {currentView === 'agents' && <MultiAgentOrchestratorView />}

          {currentView === 'camera-fleet' && (
            <CameraFleetView
              onSelectCamera={(cid) => {
                setSelectedCameraId(cid);
                setCurrentView('dashboard');
              }}
            />
          )}

          {currentView === 'evidence-queue' && <EvidenceQueueView />}

          {currentView === 'system-timeline' && <SystemTimelineView />}

          {currentView === 'diagnostics' && <CameraHealthDiagnosticsView />}

          {currentView === 'cameras' && (
            <TacticalMatrixView
              cameras={matrixCameras}
              alerts={alerts}
              onUpdateCameraName={handleUpdateCameraName}
              onTriggerAlert={handleSimulateIntrusion}
              onSelectCameraForDetails={(cam) => {
                setSelectedCameraId(String(cam.id));
                const match = cameras.find((c) => c.id === String(cam.id)) || {
                  id: String(cam.id),
                  name: cam.name,
                  location: (cam as any).location || 'Border Sector',
                  status: cam.status as any,
                  imageUrl: cam.src,
                };
                setSelectedCameraForModal(match as any);
              }}
              confidenceThreshold={confidenceThreshold}
              onConfidenceThresholdChange={setConfidenceThreshold}
            />
          )}

          {currentView === 'inspector' && (
            <IncidentInspectorView
              onOpenThreatMap={(camCode) => {
                setSelectedCameraId(camCode.toLowerCase());
                setCurrentView('threat-map');
              }}
              onOpenTargetJourney={(tid) => {
                if (tid) setSelectedJourneyTrackId(tid);
                setCurrentView('target-journey');
              }}
            />
          )}

          {currentView === 'target-journey' && (
            <TargetJourneyView
              initialTrackId={selectedJourneyTrackId}
              onSelectCamera={(cid) => {
                setSelectedCameraId(cid);
                setCurrentView('dashboard');
              }}
              onOpenIncident={(incId) => {
                setCurrentView('inspector');
              }}
              onOpenThreatMap={(cid) => {
                if (cid) setSelectedCameraId(cid);
                setCurrentView('threat-map');
              }}
            />
          )}

          {currentView === 'threat-map' && (
            <ThreatHeatmapView
              initialCameraId={selectedCameraId}
              targetHighlightCameras={heatmapHighlightCameras}
              onSelectCamera={(cid) => {
                setSelectedCameraId(cid);
                setCurrentView('dashboard');
              }}
              onOpenIncident={(incId) => {
                setCurrentView('inspector');
              }}
              onOpenTargetJourney={(tid) => {
                if (tid) setSelectedJourneyTrackId(tid);
                setCurrentView('target-journey');
              }}
              onNavigateToAnalytics={() => {
                setCurrentView('analytics');
              }}
            />
          )}

          {currentView === 'historical-logs' && (
            <HistoricalLogsView
              cameras={cameras}
              alerts={alerts}
              onSelectCamera={(cam) => {
                setSelectedCameraId(cam.id);
                setCurrentView('dashboard');
              }}
              onSelectAlert={(a) => setSelectedAlertForModal(a)}
            />
          )}

          {currentView === 'analytics' && <AnalyticsDashboard cameras={cameras} />}

          {currentView === 'stitching' && <MultiCamStitchingView />}

          {currentView === 'calibration' && <CameraCalibrationView />}

          {currentView === 'detections' && <DetectionsView />}

          {currentView === 'cctv-footage' && <CctvFootageStudio />}

          {currentView === 'alerts' && (
            <AlertsManagementView
              alerts={alerts}
              onSelectAlert={(a) => setSelectedAlertForModal(a)}
              onInitiateResponse={handleInitiateResponse}
              onResolveAlert={handleResolveAlert}
            />
          )}
          {currentView === 'notification-history' && (
            <NotificationHistory alerts={alerts} />
          )}

          {currentView === 'livestream' && (
            <QuadLiveStreamView
              cameras={cameras}
              selectedCameraId={selectedCameraId}
              onSelectCamera={(cid) => setSelectedCameraId(cid)}
              onTriggerIntrusion={() => handleSimulateIntrusion()}
              onOpenStitchingView={() => setCurrentView('stitching')}
            />
          )}

          {currentView === 'radar-map' && (
            <TacticalRadarGisView
              onSelectCamera={(cid) => {
                setSelectedCameraId(cid);
                setCurrentView('dashboard');
              }}
              onOpenTargetJourney={(tid) => {
                setSelectedJourneyTrackId(tid);
                setCurrentView('target-journey');
              }}
            />
          )}

          {currentView === 'sandbox' && (
            <DefenseSandboxView
              onTriggerAlert={handleSimulateIntrusion}
              onSetDefcon={handleSetDefconLevel}
              onNavigate={(v) => setCurrentView(v as ViewMode)}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              anomalySensitivity={anomalySensitivity}
              onAnomalySensitivityChange={setAnomalySensitivity}
              trajectoryDataset={trajectoryDataset}
              onTrajectoryDatasetChange={setTrajectoryDataset}
              showTrajectoryVectors={showTrajectoryVectors}
              onToggleTrajectoryVectors={setShowTrajectoryVectors}
              isAudioMuted={isAudioMuted}
              onToggleAudioMute={() => setIsAudioMuted(!isAudioMuted)}
              audioVolume={audioVolume}
              onAudioVolumeChange={setAudioVolume}
              onSetDefcon={handleSetDefconLevel}
              currentDefcon={defconLevel}
            />
          )}

          {currentView === 'users' && <UserManagementView />}
        </main>
      </div>

      {/* Real-time Alert / Incident Response Modal */}
      {selectedAlertForModal && (
        <AlertDetailModal
          alert={selectedAlertForModal}
          onClose={() => setSelectedAlertForModal(null)}
          onInitiateResponse={handleInitiateResponse}
          onResolveAlert={handleResolveAlert}
        />
      )}

      {/* Deep Inspection Camera Node Modal */}
      {selectedCameraForModal && (
        <CameraDetailModal
          camera={selectedCameraForModal}
          onClose={() => setSelectedCameraForModal(null)}
        />
      )}

      {/* Reports Export Modal */}
      <ReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
      />



      {/* Multi-Agent Swarm Orchestration & Fast Work Distribution Help Modal */}
      <SwarmHelpModal
        isOpen={isSwarmHelpOpen}
        onClose={() => setIsSwarmHelpOpen(false)}
        onNavigateView={(v) => setCurrentView(v)}
      />

      {/* Global Device Protection & Operator Profile Modals */}
      <ScreenLockOverlay />
      <PinConfigModal />
      <ProfileModal />
      <HelpBotWidget />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#02040a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
        <span className="text-cyan-400 font-mono text-xs tracking-widest uppercase animate-pulse">
          SEEMADRISHTI — Initialising Secure Session…
        </span>
      </div>
    </div>
  );
}

function RootAppPortal() {
  const { setPortal, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [accessGranted, setAccessGranted] = React.useState<boolean>(() => {
    return sessionStorage.getItem('seemadrishti_portal_access_granted') === 'true';
  });

  const path = location.pathname;
  const isLanding = path === '/' || path === '' || path === '/landing' || path === '/home' ||
                    path === '/features' || path === '/use-cases' || path === '/technology' || path === '/about';
  const isAuthPage = path === '/login' || path === '/auth' || path === '/signin' ||
                     path === '/signup' || path === '/register';
  const isSignupPage = path === '/signup' || path === '/register';

  const getInitialSection = () => {
    if (path === '/features') return 'features';
    if (path === '/use-cases') return 'use-cases';
    if (path === '/technology') return 'technology';
    if (path === '/about') return 'about';
    return 'home';
  };

  // Guard: Users can ONLY enter the portal via the "Get Access" button on the landing page
  useEffect(() => {
    if (isLoading) return;

    const hasAccess = sessionStorage.getItem('seemadrishti_portal_access_granted') === 'true';
    if (!hasAccess && !isLanding) {
      navigate('/', { replace: true });
      return;
    }
  }, [isLoading, isLanding, navigate, path]);

  // 1. Session initialising
  if (isLoading) return <LoadingScreen />;

  // 2. Landing page — renders at /, /features, /use-cases, /technology, /about
  if (isLanding) {
    return (
      <LandingPage
        initialSection={getInitialSection()}
        onNavigateSection={(section) => {
          navigate(section === 'home' ? '/' : `/${section}`);
        }}
        onEnterAuth={() => {
          sessionStorage.setItem('seemadrishti_portal_access_granted', 'true');
          setAccessGranted(true);
          setPortal('auth');
          navigate('/login');
        }}
      />
    );
  }

  // 3. Login / Signup pages — user ONLY gets this after clicking "Get Access"
  if (isAuthPage) {
    return (
      <Auth3DView
        initialMode={isSignupPage ? 'signup' : 'login'}
        onNavigateLanding={() => {
          sessionStorage.removeItem('seemadrishti_portal_access_granted');
          setAccessGranted(false);
          setPortal('landing');
          navigate('/');
        }}
      />
    );
  }

  // 4. Protected app routes: strictly requires access to have been granted via "Get Access" button
  const hasAccess = sessionStorage.getItem('seemadrishti_portal_access_granted') === 'true' || accessGranted;
  if (!hasAccess) {
    return (
      <LandingPage
        initialSection={getInitialSection()}
        onNavigateSection={(section) => {
          navigate(section === 'home' ? '/' : `/${section}`);
        }}
        onEnterAuth={() => {
          sessionStorage.setItem('seemadrishti_portal_access_granted', 'true');
          setAccessGranted(true);
          setPortal('auth');
          navigate('/login');
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Auth3DView
        initialMode="login"
        onNavigateLanding={() => {
          sessionStorage.removeItem('seemadrishti_portal_access_granted');
          setAccessGranted(false);
          setPortal('landing');
          navigate('/');
        }}
      />
    );
  }

  return <SeemadrishtiMainApp />;
}


export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SecurityProvider>
            <RootAppPortal />
          </SecurityProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

