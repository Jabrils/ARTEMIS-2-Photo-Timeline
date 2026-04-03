import { describe, it, expect } from 'vitest';
import { parseOEM } from '../src/data/oem-parser';

const SAMPLE_OEM = `CCSDS_OEM_VERS = 2.0
CREATION_DATE = 2026-04-02T12:00:00.000
ORIGINATOR = JSC

META_START
OBJECT_NAME = ORION
OBJECT_ID = -1024
CENTER_NAME = EARTH
REF_FRAME = EME2000
TIME_SYSTEM = UTC
START_TIME = 2026-04-01T22:35:00.000
STOP_TIME = 2026-04-02T02:35:00.000
INTERPOLATION = LAGRANGE
INTERPOLATION_DEGREE = 8
META_STOP
2026-04-01T22:35:00.000   6578.137  0.000  0.000  0.000  7.784  0.000
2026-04-01T22:39:00.000   6500.000  1800.000  50.000  -0.500  7.700  0.100
2026-04-01T22:43:00.000   6300.000  3500.000  100.000  -1.000  7.500  0.200
2026-04-01T22:47:00.000   5980.000  5100.000  150.000  -1.500  7.200  0.300
2026-04-01T22:51:00.000   5540.000  6500.000  200.000  -2.000  6.800  0.400
2026-04-01T22:55:00.000   4990.000  7700.000  250.000  -2.500  6.300  0.500
2026-04-01T22:59:00.000   4340.000  8700.000  300.000  -3.000  5.700  0.600
2026-04-01T23:03:00.000   3600.000  9500.000  350.000  -3.400  5.000  0.700
2026-04-01T23:07:00.000   2780.000  10100.000  400.000  -3.800  4.200  0.800
2026-04-01T23:11:00.000   1900.000  10500.000  450.000  -4.100  3.300  0.900
`;

const MULTI_SEGMENT_OEM = `CCSDS_OEM_VERS = 2.0
CREATION_DATE = 2026-04-02T12:00:00.000
ORIGINATOR = JSC

META_START
OBJECT_NAME = ORION
REF_FRAME = EME2000
TIME_SYSTEM = UTC
INTERPOLATION = LAGRANGE
INTERPOLATION_DEGREE = 8
META_STOP
2026-04-01T22:35:00.000   6578.137  0.000  0.000  0.000  7.784  0.000
2026-04-01T22:39:00.000   6500.000  1800.000  50.000  -0.500  7.700  0.100

META_START
OBJECT_NAME = ORION
REF_FRAME = EME2000
TIME_SYSTEM = UTC
INTERPOLATION = LAGRANGE
INTERPOLATION_DEGREE = 2
META_STOP
2026-04-01T22:43:00.000   6300.000  3500.000  100.000  -1.000  7.500  0.200
2026-04-01T22:47:00.000   5980.000  5100.000  150.000  -1.500  7.200  0.300
`;

describe('OEM Parser', () => {
  it('parses correct number of state vectors', () => {
    const result = parseOEM(SAMPLE_OEM);
    expect(result.vectors).toHaveLength(10);
  });

  it('parses metadata correctly', () => {
    const result = parseOEM(SAMPLE_OEM);
    expect(result.metadata.objectName).toBe('ORION');
    expect(result.metadata.refFrame).toBe('EME2000');
    expect(result.metadata.timeSystem).toBe('UTC');
    expect(result.metadata.interpolationDegree).toBe(8);
  });

  it('parses epoch dates correctly', () => {
    const result = parseOEM(SAMPLE_OEM);
    expect(result.vectors[0].epoch.toISOString()).toBe('2026-04-01T22:35:00.000Z');
    expect(result.vectors[1].epoch.toISOString()).toBe('2026-04-01T22:39:00.000Z');
  });

  it('parses position values correctly', () => {
    const result = parseOEM(SAMPLE_OEM);
    const v = result.vectors[0];
    expect(v.x).toBeCloseTo(6578.137, 3);
    expect(v.y).toBeCloseTo(0, 3);
    expect(v.z).toBeCloseTo(0, 3);
  });

  it('parses velocity values correctly', () => {
    const result = parseOEM(SAMPLE_OEM);
    const v = result.vectors[0];
    expect(v.vx).toBeCloseTo(0, 3);
    expect(v.vy).toBeCloseTo(7.784, 3);
    expect(v.vz).toBeCloseTo(0, 3);
  });

  it('sorts vectors by epoch', () => {
    const result = parseOEM(SAMPLE_OEM);
    for (let i = 1; i < result.vectors.length; i++) {
      expect(result.vectors[i].epochMs).toBeGreaterThan(result.vectors[i - 1].epochMs);
    }
  });

  it('handles multiple META segments', () => {
    const result = parseOEM(MULTI_SEGMENT_OEM);
    expect(result.vectors).toHaveLength(4);
    expect(result.vectors[0].x).toBeCloseTo(6578.137, 3);
    expect(result.vectors[3].x).toBeCloseTo(5980, 3);
  });

  it('handles empty input', () => {
    const result = parseOEM('');
    expect(result.vectors).toHaveLength(0);
  });

  it('skips comment lines', () => {
    const withComments = SAMPLE_OEM.replace(
      '2026-04-01T22:35:00.000',
      'COMMENT This is a test\n2026-04-01T22:35:00.000',
    );
    const result = parseOEM(withComments);
    expect(result.vectors).toHaveLength(10);
  });
});
