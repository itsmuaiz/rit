import { supabase } from './supabase';
import { Trip } from './types';
import { getDeviceId, getLocalTrips, saveLocalTrips } from './storage';

export async function loadTrips(): Promise<Trip[]> {
  const deviceId = await getDeviceId();
  const localTrips = await getLocalTrips();
  if (!supabase) return localTrips.sort((a, b) => b.started_at.localeCompare(a.started_at));

  const { data, error } = await supabase
    .from('rit_trips')
    .select('*')
    .eq('device_id', deviceId)
    .order('started_at', { ascending: false });
  if (!error && data) {
    const trips = data as Trip[];
    await saveLocalTrips(trips);
    return trips;
  }
  return localTrips.sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export async function saveTrip(trip: Trip): Promise<void> {
  const localTrips = await getLocalTrips();
  await saveLocalTrips([trip, ...localTrips.filter((item) => item.id !== trip.id)]);
  if (supabase) {
    const { error } = await supabase.from('rit_trips').upsert(trip);
    if (error) throw error;
  }
}

export async function updateTrip(id: string, description: string): Promise<void> {
  const localTrips = await getLocalTrips();
  const trips = localTrips.map((trip) => trip.id === id ? { ...trip, description } : trip);
  await saveLocalTrips(trips);
  if (supabase) {
    const { error } = await supabase.from('rit_trips').update({ description }).eq('id', id);
    if (error) throw error;
  }
}

export async function removeTrip(id: string): Promise<void> {
  const localTrips = await getLocalTrips();
  await saveLocalTrips(localTrips.filter((trip) => trip.id !== id));
  if (supabase) {
    const { error } = await supabase.from('rit_trips').delete().eq('id', id);
    if (error) throw error;
  }
}
