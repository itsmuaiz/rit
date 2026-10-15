import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { clearActiveTrip, getActiveTrip, makeTripId, saveActiveTrip } from './storage';
import { saveTrip, loadTrips } from './trips';
import { Coordinate, Trip, TripDraft } from './types';

const context = createContext<{
  trips: Trip[];
  currentLocation: Coordinate | null;
  route: Coordinate[];
  isTracking: boolean;
  elapsed: number;
  distanceKm: number;
  locationMessage: string | null;
  refreshTrips: () => Promise<void>;
  startTrip: () => Promise<boolean>;
  stopTrip: () => Promise<TripDraft | null>;
}>({
  trips: [], currentLocation: null, route: [], isTracking: false, elapsed: 0, distanceKm: 0,
  locationMessage: null, refreshTrips: async () => undefined, startTrip: async () => false, stopTrip: async () => null,
});

function distanceBetween(a: Coordinate, b: Coordinate): number {
  const earthRadius = 6371;
  const latitude = (b.latitude - a.latitude) * Math.PI / 180;
  const longitude = (b.longitude - a.longitude) * Math.PI / 180;
  const h = Math.sin(latitude / 2) ** 2 + Math.cos(a.latitude * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) * Math.sin(longitude / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function RitProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [route, setRoute] = useState<Coordinate[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const watcher = useRef<Location.LocationSubscription | null>(null);
  const lastPoint = useRef<Coordinate | null>(null);

  const refreshTrips = async () => setTrips(await loadTrips());

  useEffect(() => {
    refreshTrips();
    getActiveTrip().then((stored) => {
      if (stored) setLocationMessage('Een onderbroken rit is beschikbaar op dit apparaat.');
    });
    return () => watcher.current?.remove();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isTracking) timer = setInterval(() => setElapsedValue((value) => value + 1), 1000);
    return () => { if (timer) clearInterval(timer); };
  }, [isTracking]);

  const [elapsed, setElapsedValue] = useState(0);

  const startTrip = async (): Promise<boolean> => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setLocationMessage('Locatietoegang is nodig om echte kilometers te meten. Geef Rit toegang tot je locatie in Instellingen.');
      return false;
    }
    if (Platform.OS !== 'web') {
      await Location.requestBackgroundPermissionsAsync();
    }
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const point: Coordinate = { latitude: location.coords.latitude, longitude: location.coords.longitude, timestamp: Date.now() };
    const now = new Date().toISOString();
    lastPoint.current = point;
    setCurrentLocation(point);
    setRoute([point]);
    setDistanceKm(0);
    setElapsedValue(0);
    setStartedAt(now);
    setIsTracking(true);
    setLocationMessage(null);
    await saveActiveTrip(JSON.stringify({ id: makeTripId(), startedAt: now, points: [point] }));
    watcher.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
      async (next) => {
        const nextPoint: Coordinate = { latitude: next.coords.latitude, longitude: next.coords.longitude, timestamp: Date.now() };
        const previous = lastPoint.current;
        if (!previous) return;
        const segment = distanceBetween(previous, nextPoint);
        if (segment < 0.01 || segment > 0.5) return;
        lastPoint.current = nextPoint;
        setCurrentLocation(nextPoint);
        setRoute((points) => [...points, nextPoint]);
        setDistanceKm((value) => value + segment);
        await saveActiveTrip(JSON.stringify({ startedAt: now, points: [...route, nextPoint] }));
      },
    );
    return true;
  };

  const stopTrip = async (): Promise<TripDraft | null> => {
    if (!startedAt) return null;
    watcher.current?.remove();
    watcher.current = null;
    setIsTracking(false);
    const endedAt = new Date().toISOString();
    await clearActiveTrip();
    const draft: TripDraft = {
      startedAt, endedAt, distanceKm, points: route,
      startAddress: 'Huidige locatie', endAddress: currentLocation ? 'Huidige locatie' : 'Niet beschikbaar',
    };
    setStartedAt(null);
    return draft;
  };

  const value = useMemo(() => ({ trips, currentLocation, route, isTracking, elapsed, distanceKm, locationMessage, refreshTrips, startTrip, stopTrip }), [trips, currentLocation, route, isTracking, elapsed, distanceKm, locationMessage]);
  return <context.Provider value={value}>{children}</context.Provider>;
}

export function useRit(): React.ContextType<typeof context> { return useContext(context); }

export function isWeb(): boolean { return Platform.OS === 'web'; }
