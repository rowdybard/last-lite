import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQualityProfile } from '../src/utils/quality-profile';

// Mock navigator.deviceMemory
const mockNavigator = {
  deviceMemory: 4,
  userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36',
};

describe('Quality Profile Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.CLIENT_LOW_SPEC_MODE;
    delete process.env.CLIENT_RES_SCALE;
    delete process.env.CLIENT_MAX_ENTITIES;
  });

  it('should return low profile when CLIENT_LOW_SPEC_MODE=1', () => {
    process.env.CLIENT_LOW_SPEC_MODE = '1';
    
    const profile = getQualityProfile();
    
    expect(profile.level).toBe('low');
    expect(profile.hardwareScalingLevel).toBeGreaterThanOrEqual(1.25);
    expect(profile.shadowsEnabled).toBe(false);
    expect(profile.postProcessingEnabled).toBe(false);
  });

  it('should return low profile when deviceMemory <= 4', () => {
    Object.defineProperty(navigator, 'deviceMemory', {
      value: 4,
      writable: true,
    });
    
    const profile = getQualityProfile();
    
    expect(profile.level).toBe('low');
    expect(profile.hardwareScalingLevel).toBeGreaterThanOrEqual(1.25);
  });

  it('should return low profile for Chromebook user agent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36',
      writable: true,
    });
    
    const profile = getQualityProfile();
    
    expect(profile.level).toBe('low');
  });

  it('should return medium profile for normal devices', () => {
    Object.defineProperty(navigator, 'deviceMemory', {
      value: 8,
      writable: true,
    });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      writable: true,
    });
    
    const profile = getQualityProfile();
    
    expect(profile.level).toBe('medium');
    expect(profile.hardwareScalingLevel).toBeLessThan(1.25);
  });

  it('should respect CLIENT_RES_SCALE environment variable', () => {
    process.env.CLIENT_RES_SCALE = '1.5';
    
    const profile = getQualityProfile();
    
    expect(profile.hardwareScalingLevel).toBe(1.5);
  });

  it('should respect CLIENT_MAX_ENTITIES environment variable', () => {
    process.env.CLIENT_MAX_ENTITIES = '60';
    
    const profile = getQualityProfile();
    
    expect(profile.maxEntities).toBe(60);
  });
});
