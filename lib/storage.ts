import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from './types';

const deviceKey = 'rit.device-id';
const tripsKey = 'rit.trips';
const activeKey = 'rit.active-trip';

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function getDeviceId(): Promise<string> {
  const stored = await AsyncStorage.getItem(deviceKey);
  if (stored) return stored;
  const id = createId();
  await AsyncStorage.setItem(deviceKey, id);
  return id;
}

export async function getLocalTrips(): Promise<Trip[]> {
  const stored = await AsyncStorage.getItem(tripsKey);
  if (!stored) return [];
  try {
    const trips = JSON.parse(stored) as Trip[];
    return Array.isArray(trips) ? trips : [];
  } catch {
    return [];
  }
}

export async function saveLocalTrips(trips: Trip[]): Promise<void> {
  await AsyncStorage.setItem(tripsKey, JSON.stringify(trips));
}

export async function saveActiveTrip(value: string): Promise<void> {
  await AsyncStorage.setItem(activeKey, value);
}

export async function getActiveTrip(): Promise<string | null> {
  return AsyncStorage.getItem(activeKey);
}

export async function clearActiveTrip(): Promise<void> {
  await AsyncStorage.removeItem(activeKey);
}

export function makeTripId(): string {
  return createId();
}
