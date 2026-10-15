import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CarFront, ChevronRight, MapPin, Mic, Navigation, Search, Square, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MapSurface } from '@/components/MapSurface';
import { useRit } from '@/lib/RitContext';
import { makeTripId } from '@/lib/storage';
import { saveTrip } from '@/lib/trips';
import { TripDraft } from '@/lib/types';

function formatKm(value: number): string { return value.toFixed(1).replace('.', ','); }
function formatTime(seconds: number): string { return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }

export default function DriveScreen() {
  const { currentLocation, route, isTracking, elapsed, distanceKm, locationMessage, startTrip, stopTrip, refreshTrips } = useRit();
  const [destination, setDestination] = useState('');
  const [draft, setDraft] = useState<TripDraft | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startTrip();
  };

  const handleStop = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDraft(await stopTrip());
  };

  const saveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const deviceId = await import('@/lib/storage').then(({ getDeviceId }) => getDeviceId());
      await saveTrip({ id: makeTripId(), device_id: deviceId, started_at: draft.startedAt, ended_at: draft.endedAt, distance_km: draft.distanceKm, start_address: draft.startAddress, end_address: draft.endAddress, description: description.trim() || null, route_points: draft.points, created_at: new Date().toISOString() });
      await refreshTrips();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDraft(null);
      setDescription('');
    } catch {
      Alert.alert('Opslaan mislukt', 'De rit staat lokaal veilig opgeslagen. Probeer later opnieuw te synchroniseren.');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.mapArea}>
        <MapSurface location={currentLocation} route={route} />
        <View style={styles.searchWrap}>
          <Search size={22} color="#667181" />
          <TextInput value={destination} onChangeText={setDestination} placeholder="Waar wil je naartoe?" placeholderTextColor="#6D7787" style={styles.searchInput} accessibilityLabel="Bestemming zoeken" />
          <Mic size={21} color="#667181" />
        </View>
        {destination.length > 2 && !isTracking && <Pressable style={styles.suggestion} onPress={() => Alert.alert('Navigatiekaart nodig', 'Ritregistratie werkt volledig met GPS. Voor ingebouwde turn-by-turn navigatie is nog een kaartdienst en native API-sleutel nodig; daarom wordt hier geen route gesimuleerd.')}><MapPin size={20} color="#087FF5" /><View><Text style={styles.suggestionTitle}>{destination}</Text><Text style={styles.suggestionSub}>Navigatiekaart is nog niet gekoppeld</Text></View><ChevronRight size={20} color="#8A94A3" /></Pressable>}
        {locationMessage && <View style={styles.message}><Text style={styles.messageText}>{locationMessage}</Text></View>}
      </View>
      <View style={[styles.panel, isTracking && styles.activePanel]}>
        <View style={styles.grabber} />
        {isTracking ? (
          <>
            <Text style={styles.activeLabel}><View style={styles.liveDot} /> Rit wordt opgenomen</Text>
            <Text style={styles.distance}>{formatKm(distanceKm)} <Text style={styles.distanceUnit}>km</Text></Text>
            <Text style={styles.timer}>{formatTime(elapsed)}</Text>
            <Text style={styles.helper}>{currentLocation ? 'GPS-route wordt gemeten' : 'Wachten op GPS-signaal'}</Text>
            <Pressable style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]} onPress={handleStop}><Square size={18} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.buttonText}>Stop rit</Text></Pressable>
          </>
        ) : (
          <>
            <Text style={styles.panelTitle}>Klaar om te rijden?</Text>
            <Text style={styles.panelSub}>Je echte GPS-route wordt automatisch gemeten.</Text>
            <Pressable style={({ pressed }) => [styles.startButton, pressed && styles.pressed]} onPress={handleStart}><CarFront size={25} color="#FFFFFF" /><Text style={styles.buttonText}>Start rit</Text></Pressable>
            <View style={styles.quickRow}><Navigation size={18} color="#087FF5" /><Text style={styles.quickText}>Navigatie kan tegelijk met registratie werken</Text></View>
          </>
        )}
      </View>
      <Modal visible={Boolean(draft)} transparent animationType="slide" onRequestClose={() => setDraft(null)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.saveCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Rit opslaan</Text><Pressable onPress={() => setDraft(null)} style={styles.close}><X size={22} color="#566170" /></Pressable></View>
            <Text style={styles.savedDistance}>{draft ? formatKm(draft.distanceKm) : '0,0'} km</Text>
            <Text style={styles.savedMeta}>{draft ? new Date(draft.startedAt).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</Text>
            <View style={styles.addressRow}><MapPin size={18} color="#087FF5" /><Text style={styles.addressText}>{draft?.startAddress}</Text></View><View style={styles.addressRow}><MapPin size={18} color="#EA4335" /><Text style={styles.addressText}>{draft?.endAddress}</Text></View>
            <TextInput value={description} onChangeText={setDescription} placeholder="Zakelijke omschrijving (optioneel)" placeholderTextColor="#8B95A3" style={styles.description} multiline />
            <Pressable style={({ pressed }) => [styles.startButton, pressed && styles.pressed]} onPress={saveDraft} disabled={saving}><Text style={styles.buttonText}>{saving ? 'Opslaan…' : 'Rit opslaan'}</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FA' }, mapArea: { flex: 1, minHeight: 360 },
  searchWrap: { position: 'absolute', top: 16, left: 20, right: 20, height: 58, borderRadius: 30, backgroundColor: '#FFFFFFF2', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 13, shadowColor: '#10233F', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  searchInput: { flex: 1, fontSize: 17, color: '#17202C', fontWeight: '500' }, suggestion: { position: 'absolute', left: 20, right: 20, top: 82, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#10233F', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 5 }, elevation: 5 }, suggestionTitle: { fontSize: 16, fontWeight: '600', color: '#17202C' }, suggestionSub: { marginTop: 3, color: '#778291', fontSize: 13 },
  message: { position: 'absolute', top: 88, left: 24, right: 24, borderRadius: 14, backgroundColor: '#FFF8E7', padding: 12 }, messageText: { color: '#785B12', textAlign: 'center', fontSize: 13 },
  panel: { backgroundColor: '#FFFFFFF5', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, shadowColor: '#10233F', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: -5 }, elevation: 8 }, activePanel: { paddingTop: 10 }, grabber: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#C8CED6', alignSelf: 'center', marginBottom: 18 }, panelTitle: { color: '#18212C', fontSize: 23, fontWeight: '700', textAlign: 'center' }, panelSub: { color: '#7B8695', textAlign: 'center', marginTop: 6, marginBottom: 18, fontSize: 14 }, startButton: { height: 58, borderRadius: 30, backgroundColor: '#087FF5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }, stopButton: { height: 58, borderRadius: 30, backgroundColor: '#F12D38', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }, buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] }, quickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }, quickText: { color: '#7B8695', fontSize: 12 }, activeLabel: { color: '#4F5A69', textAlign: 'center', fontSize: 16, fontWeight: '600' }, liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#087FF5', marginRight: 8 }, distance: { color: '#111820', fontSize: 56, lineHeight: 64, fontWeight: '800', textAlign: 'center', marginTop: 8 }, distanceUnit: { fontSize: 28, fontWeight: '700' }, timer: { textAlign: 'center', color: '#303B4B', fontSize: 27, fontWeight: '600', marginTop: 2 }, helper: { color: '#7B8695', textAlign: 'center', marginBottom: 18, marginTop: 4 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0D1A2B66' }, saveCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 34 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, modalTitle: { fontSize: 24, fontWeight: '700', color: '#17202C' }, close: { padding: 8 }, savedDistance: { fontSize: 44, fontWeight: '800', color: '#111820', marginTop: 12 }, savedMeta: { color: '#788392', fontSize: 14, marginBottom: 18 }, addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }, addressText: { color: '#323D4B', fontSize: 15 }, description: { minHeight: 64, borderRadius: 14, backgroundColor: '#F3F5F8', padding: 14, marginVertical: 16, color: '#1A2430', fontSize: 15, textAlignVertical: 'top' },
});
