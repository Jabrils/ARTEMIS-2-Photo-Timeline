import { useEffect, useRef } from 'react';
import { parseOEM } from '../data/oem-parser';
import { useMissionStore } from '../store/mission-store';

const OEM_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const HORIZONS_POLL_INTERVAL = 30 * 60 * 1000; // 30 minutes

export function useOEM() {
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchOEM() {
      try {
        const res = await fetch('/api/oem');
        if (!res.ok) throw new Error(`OEM fetch failed: ${res.status}`);
        const text = await res.text();
        const data = parseOEM(text);
        if (data.vectors.length > 0) {
          useMissionStore.getState().setOemData(data.vectors);
        }
      } catch (err) {
        console.warn('OEM fetch failed, retrying in 30s:', err);
        setTimeout(fetchOEM, 30_000);
      }
    }

    async function fetchMoonPosition() {
      try {
        const res = await fetch('/api/horizons');
        if (!res.ok) return;
        const data = await res.json();

        // Parse Horizons vector table response
        if (data.result) {
          const lines = data.result.split('\n');
          let inData = false;
          for (const line of lines) {
            if (line.trim() === '$$SOE') { inData = true; continue; }
            if (line.trim() === '$$EOE') break;
            if (inData) {
              const parts = line.trim().split(/\s+/);
              // Horizons vector format: JDTDB, Calendar date, X, Y, Z, VX, VY, VZ
              // Find the numeric values
              const nums = parts.filter((p: string) => /^-?\d+\./.test(p)).map(Number);
              if (nums.length >= 3) {
                useMissionStore.getState().setMoonPosition({
                  x: nums[0], y: nums[1], z: nums[2],
                });
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Horizons fetch failed:', err);
        // Fallback: mean Moon distance along X axis
        useMissionStore.getState().setMoonPosition({ x: 384400, y: 0, z: 0 });
      }
    }

    fetchOEM();
    fetchMoonPosition();

    const oemInterval = setInterval(fetchOEM, OEM_POLL_INTERVAL);
    const moonInterval = setInterval(fetchMoonPosition, HORIZONS_POLL_INTERVAL);

    return () => {
      clearInterval(oemInterval);
      clearInterval(moonInterval);
    };
  }, []);
}
