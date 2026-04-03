export interface StateVector {
  epoch: Date;
  epochMs: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface OEMMetadata {
  objectName: string;
  refFrame: string;
  timeSystem: string;
  interpolationDegree: number;
}

export interface OEMData {
  metadata: OEMMetadata;
  vectors: StateVector[];
}

export function parseOEM(text: string): OEMData {
  const lines = text.split('\n');
  const vectors: StateVector[] = [];
  let metadata: OEMMetadata = {
    objectName: 'UNKNOWN',
    refFrame: 'EME2000',
    timeSystem: 'UTC',
    interpolationDegree: 8,
  };

  let inMeta = false;
  let inData = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('COMMENT')) continue;

    if (line === 'META_START') {
      inMeta = true;
      inData = false;
      continue;
    }
    if (line === 'META_STOP') {
      inMeta = false;
      inData = true;
      continue;
    }
    if (line === 'COVARIANCE_START') {
      inData = false;
      continue;
    }
    if (line === 'COVARIANCE_STOP') {
      continue;
    }

    if (inMeta) {
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      switch (key) {
        case 'OBJECT_NAME': metadata.objectName = val; break;
        case 'REF_FRAME': metadata.refFrame = val; break;
        case 'TIME_SYSTEM': metadata.timeSystem = val; break;
        case 'INTERPOLATION_DEGREE': metadata.interpolationDegree = parseInt(val, 10); break;
      }
      continue;
    }

    if (inData) {
      // Skip header lines (CCSDS_OEM_VERS, CREATION_DATE, ORIGINATOR, etc.)
      if (line.includes('=') || line.startsWith('CCSDS') || line.startsWith('CREATION')
          || line.startsWith('ORIGINATOR') || line.startsWith('START_TIME')
          || line.startsWith('STOP_TIME') || line.startsWith('CENTER_NAME')) {
        continue;
      }

      // Data line: epoch x y z vx vy vz
      const parts = line.split(/\s+/);
      if (parts.length < 7) continue;

      const epochStr = parts[0];
      // Handle both "2026-04-01T22:35:00.000" and "2026-04-01 22:35:00.000"
      const normalizedEpoch = epochStr.includes('T') ? epochStr : epochStr + 'T' + parts[1];
      const offset = epochStr.includes('T') ? 0 : 1;

      const epoch = new Date(normalizedEpoch + 'Z');
      if (isNaN(epoch.getTime())) continue;

      const x = parseFloat(parts[1 + offset]);
      const y = parseFloat(parts[2 + offset]);
      const z = parseFloat(parts[3 + offset]);
      const vx = parseFloat(parts[4 + offset]);
      const vy = parseFloat(parts[5 + offset]);
      const vz = parseFloat(parts[6 + offset]);

      if ([x, y, z, vx, vy, vz].some(isNaN)) continue;

      vectors.push({ epoch, epochMs: epoch.getTime(), x, y, z, vx, vy, vz });
    }
  }

  vectors.sort((a, b) => a.epochMs - b.epochMs);

  return { metadata, vectors };
}
