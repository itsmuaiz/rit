import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Coordinate } from '@/lib/types';

const fallbackRegion: Region = { latitude: 52.0907, longitude: 5.1214, latitudeDelta: 0.12, longitudeDelta: 0.12 };

export function MapSurface({ location, route, detail = false }: { location: Coordinate | null; route: Coordinate[]; detail?: boolean }) {
  const region = useMemo<Region>(() => location ? { ...location, latitudeDelta: 0.055, longitudeDelta: 0.055 } : fallbackRegion, [location]);
  if (Platform.OS === 'web') {
    return <WebMap location={location} route={route} />;
  }
  return (
    <MapView style={styles.map} provider={PROVIDER_DEFAULT} initialRegion={region} region={region} showsUserLocation={Boolean(location)} showsMyLocationButton={false} toolbarEnabled={false}>
      {route.length > 1 && <Polyline coordinates={route} strokeColor="#087FF5" strokeWidth={detail ? 6 : 5} />}
      {location && <Marker coordinate={location} />}
      {detail && route.length > 1 && <Marker coordinate={route[route.length - 1]} pinColor="#EA4335" />}
    </MapView>
  );
}

function WebMap({ location, route }: { location: Coordinate | null; route: Coordinate[] }) {
  const points = route.map((point) => `${50 + (point.longitude - (location?.longitude ?? 5.1214)) * 180}%,${50 - (point.latitude - (location?.latitude ?? 52.0907)) * 180}%`).join(' ');
  return (
    <View style={styles.webMap}>
      <View style={styles.water} />
      <View style={[styles.road, styles.roadOne]} />
      <View style={[styles.road, styles.roadTwo]} />
      <View style={[styles.road, styles.roadThree]} />
      <View style={[styles.road, styles.roadFour]} />
      {route.length > 1 && <View style={[styles.route, { left: 0, right: 0, top: 0, bottom: 0 }]}><View style={[styles.routeLine, { transform: [{ rotate: '-12deg' }] }]} /></View>}
      {location && <View style={styles.locationDot} />}
      <View style={styles.mapLabel}><View style={styles.labelDot} /><View><View style={styles.labelLine} /><View style={styles.labelLineShort} /></View></View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  webMap: { flex: 1, overflow: 'hidden', backgroundColor: '#EAF2EA' },
  water: { position: 'absolute', width: 190, height: '140%', left: '48%', top: '-20%', backgroundColor: '#BFE5EE', transform: [{ rotate: '18deg' }] },
  road: { position: 'absolute', backgroundColor: '#FFFFFF', opacity: 0.9, height: 14, width: '150%', transform: [{ rotate: '28deg' }] },
  roadOne: { top: '25%', left: '-20%' },
  roadTwo: { top: '58%', left: '-20%', transform: [{ rotate: '-18deg' }] },
  roadThree: { top: '74%', left: '-20%', height: 8, transform: [{ rotate: '12deg' }] },
  roadFour: { top: '41%', left: '-20%', height: 8, transform: [{ rotate: '75deg' }] },
  route: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  routeLine: { width: '75%', height: 7, backgroundColor: '#087FF5', borderRadius: 6 },
  locationDot: { position: 'absolute', left: '50%', top: '51%', marginLeft: -12, marginTop: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: '#087FF5', borderWidth: 4, borderColor: '#FFFFFF' },
  mapLabel: { position: 'absolute', left: '31%', top: '34%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#45A458' },
  labelLine: { width: 72, height: 8, borderRadius: 4, backgroundColor: '#98B79A' },
  labelLineShort: { marginTop: 5, width: 48, height: 6, borderRadius: 4, backgroundColor: '#B5C9B6' },
});
