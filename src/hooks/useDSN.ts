import { useEffect, useRef } from 'react';
import { parseDSN } from '../data/dsn-parser';
import { useMissionStore } from '../store/mission-store';

const DSN_POLL_INTERVAL = 30_000; // 30 seconds

export function useDSN() {
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchDSN() {
      try {
        const res = await fetch('/api/dsn');
        if (!res.ok) return;
        const text = await res.text();
        const stations = parseDSN(text);
        useMissionStore.getState().setDsnStations(stations);
      } catch (err) {
        console.warn('DSN fetch failed:', err);
      }
    }

    fetchDSN();
    const interval = setInterval(fetchDSN, DSN_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);
}
