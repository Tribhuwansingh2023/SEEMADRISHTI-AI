/**
 * SEEMADRISHTI AI — Tactical CV Profile Loader & Parameter Resolver
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import fs from 'fs';
import path from 'path';

export interface TacticalCvProfile {
  confidence_threshold: number;
  iou_threshold: number;
  clahe_clip_limit: number;
  clahe_grid_size: [number, number];
  gaussian_blur_kernel: number;
  tracker_buffer: number;
  description: string;
}

export function loadTacticalProfiles(): Record<string, TacticalCvProfile> {
  const profilePath = path.resolve(process.cwd(), 'cv_service/config/tactical_cv_profiles.json');
  try {
    if (fs.existsSync(profilePath)) {
      const raw = fs.readFileSync(profilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return parsed.profiles || {};
    }
  } catch (err) {
    console.warn('[CVProfileLoader] Could not load tactical profiles from disk:', err);
  }

  // Fallback default
  return {
    TACTICAL_DEFAULT: {
      confidence_threshold: 0.3,
      iou_threshold: 0.45,
      clahe_clip_limit: 2.0,
      clahe_grid_size: [8, 8],
      gaussian_blur_kernel: 3,
      tracker_buffer: 30,
      description: "Default fallback profile"
    }
  };
}
