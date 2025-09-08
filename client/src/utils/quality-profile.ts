import { QualityProfile } from '@shared/types';

export function getQualityProfile(): QualityProfile {
  // Check environment variable override
  const forceLowSpec = process.env.CLIENT_LOW_SPEC_MODE === '1';
  
  // Check device memory
  const deviceMem = (navigator as any).deviceMemory ?? 8;
  const lowMemory = deviceMem <= 4;
  
  // Check for Chromebook user agent
  const isChromebook = /Cros/i.test(navigator.userAgent);
  
  // Determine quality level
  let level: 'low' | 'medium' | 'high' = 'medium';
  if (forceLowSpec || lowMemory || isChromebook) {
    level = 'low';
  } else if (deviceMem >= 16) {
    level = 'high';
  }
  
  // Get scaling level
  let hardwareScalingLevel = 1.0;
  if (process.env.CLIENT_RES_SCALE) {
    hardwareScalingLevel = parseFloat(process.env.CLIENT_RES_SCALE);
  } else if (level === 'low') {
    hardwareScalingLevel = 1.25;
  } else {
    hardwareScalingLevel = Math.min(1, window.devicePixelRatio);
  }
  
  // Get max entities
  let maxEntities = 80;
  if (process.env.CLIENT_MAX_ENTITIES) {
    maxEntities = parseInt(process.env.CLIENT_MAX_ENTITIES);
  } else if (level === 'low') {
    maxEntities = 60;
  } else if (level === 'high') {
    maxEntities = 100;
  }
  
  return {
    level,
    hardwareScalingLevel,
    shadowsEnabled: level !== 'low',
    postProcessingEnabled: level === 'high',
    maxEntities,
  };
}
