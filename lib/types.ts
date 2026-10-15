export type Coordinate = {
  latitude: number;
  longitude: number;
  timestamp?: number;
};

export type Trip = {
  id: string;
  device_id: string;
  started_at: string;
  ended_at: string;
  distance_km: number;
  start_address: string | null;
  end_address: string | null;
  description: string | null;
  route_points: Coordinate[];
  created_at: string;
};

export type TripDraft = {
  startedAt: string;
  endedAt: string;
  distanceKm: number;
  points: Coordinate[];
  startAddress: string;
  endAddress: string;
};
