/**
 * SEEMADRISHTI — CCTV Footage Studio Types
 */

export interface CctvVideoSource {
  id: string;
  cameraId: string;
  name: string;
  filename: string;
  streamUrl: string;
  location: string;
  description: string;
  resolution: string;
  fps: number;
  duration: string;
  tag: string;
  isDefault?: boolean;
}

export interface CctvPlateRecord {
  id: string;
  vehicle_type: string;
  vehicle_id?: string;
  plate_number: string;
  confidence: number;
  readable: boolean;
  time: string;
  camera_id?: string;
  snapshot_url?: string;
}

export interface CctvTimelineEvent {
  id: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  object_label: string;
  confidence: number;
  timestamp: string;
  video_time_seconds?: number;
  details: string;
  snapshot_url?: string;
  camera_id: string;
}

export interface YoloDebugTelemetry {
  yolo_status: string;
  model: string;
  device: string;
  device_name: string;
  precision: string;
  input_size: number;
  confidence: number;
  iou: number;
  tracker: string;
  max_lost_frames: number;
  detections_count: number;
  active_tracks_count: number;
  ai_fps: number;
  preprocess_ms: number;
  inference_ms: number;
  tracking_ms: number;
  postprocess_ms: number;
  total_ms: number;
  queue_size?: number;
  dropped_frames?: number;
  cpu_percent?: number;
  ram_percent?: number;
  vram?: string;
}
