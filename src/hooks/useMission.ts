import { useState, useEffect } from 'react';
import { getMissionElapsed } from '../data/mission-config';

export function useMission() {
  const [mission, setMission] = useState(getMissionElapsed());

  useEffect(() => {
    const interval = setInterval(() => {
      setMission(getMissionElapsed());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return mission;
}
