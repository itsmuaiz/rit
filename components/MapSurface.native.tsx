import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Coordinate } from '@/lib/types';

const fallbackRegion: Region = { latitude: 52.0907, longitude: 5.1214, latitudeDelta: 0.12, longitudeDelta: 0.12 };

export function MapSurface({ location, route, detail = false }: { location: Coordinate | null; route: Coordinate[]; detail?: boolean }) {
  const region = useMemo<Region>(() => location ? { ...location, latitudeDelta: 0.055, longitudeDelta: 0.055 } : fallbackRegion, [location]);
  return (
    <MapView style={styles.map} provider={PROVIDER_DEFAULT} initialRegion={region} region={region} showsUserLocation={Boolean(location)} showsMyLocationButton={false} toolbarEnabled={false}>
      {route.length > 1 && <Polyline coordinates={route} strokeColor="#087FF5" strokeWidth={detail ? 6 : 5} />}
      {location && <Marker coordinate={location} />}
      {detail && route.length > 1 && <Marker coordinate={route[route.length - 1]} pinColor="#EA4335" />}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
