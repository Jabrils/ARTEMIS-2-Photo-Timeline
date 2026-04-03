import { create } from 'zustand';
import type { StateVector } from '../data/oem-parser';
import type { DsnStation } from '../data/dsn-parser';

export interface SpacecraftState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number;
  earthDist: number;
  moonDist: number | null;
}

export type CameraMode = 'free' | 'follow-orion' | 'earth-view' | 'moon-view';

interface MissionStore {
  isLoading: boolean;
  oemData: StateVector[] | null;
  moonPosition: { x: number; y: number; z: number } | null;
  spacecraft: SpacecraftState;
  dsnStations: DsnStation[];
  cameraMode: CameraMode;
  chatOpen: boolean;

  setOemData: (data: StateVector[]) => void;
  setMoonPosition: (pos: { x: number; y: number; z: number }) => void;
  setSpacecraft: (state: Partial<SpacecraftState>) => void;
  setDsnStations: (stations: DsnStation[]) => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleChat: () => void;
  setLoading: (loading: boolean) => void;
}

export const useMissionStore = create<MissionStore>((set) => ({
  isLoading: true,
  oemData: null,
  moonPosition: null,
  spacecraft: {
    x: 0, y: 0, z: 0,
    vx: 0, vy: 0, vz: 0,
    speed: 0, earthDist: 0, moonDist: null,
  },
  dsnStations: [],
  cameraMode: 'free',
  chatOpen: false,

  setOemData: (data) => set({ oemData: data, isLoading: false }),
  setMoonPosition: (pos) => set({ moonPosition: pos }),
  setSpacecraft: (state) =>
    set((prev) => ({ spacecraft: { ...prev.spacecraft, ...state } })),
  setDsnStations: (stations) => set({ dsnStations: stations }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleChat: () => set((prev) => ({ chatOpen: !prev.chatOpen })),
  setLoading: (loading) => set({ isLoading: loading }),
}));
