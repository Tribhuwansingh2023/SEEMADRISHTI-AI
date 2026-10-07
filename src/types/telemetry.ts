/**
 * SEEMADRISHTI AI — System & Sensor Telemetry Type Definitions
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

export type ThreatSeverityLevel = 'NORMAL' | 'ELEVATED' | 'WARNING' | 'CRITICAL' | 'BREACH';

export interface PerformanceTelemetry {
  fps: number;
  latencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  gpuUtilizationPercent?: number;
  cpuUtilizationPercent: number;
  memoryUsageMb: number;
  droppedFrames: number;
  activeTracksCount: number;
}

export interface StreamQualityPreset {
  id: '4K_UHD' | '1080P_TACTICAL' | '720P_EDGE';
  label: string;
  width: number;
  height: number;
  bitrateKbps: number;
  recommendedFps: number;
  description: string;
}

export interface ForensicSealManifest {
  manifestId: string;
  incidentId: string;
  cameraId: string;
  timestamp: string;
  sha256Hash: string;
  operatorBadgeId: string;
  operatorName: string;
  digitalSignature: string;
  tamperVerified: boolean;
  fileSizeBytes: number;
}

export interface SwarmConsensusMetrics {
  consensusScore: number;
  participatingAgents: string[];
  confidenceMatrix: Record<string, number>;
  recommendedCountermeasure: string;
  deliberationRounds: number;
}
