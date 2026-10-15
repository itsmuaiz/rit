import { Tabs } from 'expo-router';
import { CarFront, ClipboardList } from 'lucide-react-native';
import { Platform, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#087FF5',
      tabBarInactiveTintColor: '#8993A3',
      tabBarLabelStyle: styles.label,
      tabBarStyle: styles.tabBar,
      tabBarHideOnKeyboard: true,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Rijden', tabBarIcon: ({ color, size }) => <CarFront color={color} size={size} strokeWidth={2.2} /> }} />
      <Tabs.Screen name="rides" options={{ title: 'Ritten', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} strokeWidth={2.2} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', paddingBottom: Platform.OS === 'ios' ? 2 : 0 },
  tabBar: { height: Platform.OS === 'ios' ? 82 : 64, paddingTop: 8, backgroundColor: '#FFFFFFF2', borderTopColor: '#E6EBF2', elevation: 0 },
});
