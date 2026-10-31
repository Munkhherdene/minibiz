import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui';
import { colors } from '@/constants/theme';
import { mn } from '@/i18n/mn';

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: mn.tabs.home, icon: 'home' },
  { name: 'products', title: mn.tabs.products, icon: 'products' },
  { name: 'sales', title: mn.tabs.sales, icon: 'sales' },
  { name: 'finance', title: mn.tabs.finance, icon: 'finance' },
  { name: 'profile', title: mn.tabs.profile, icon: 'profile' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <Icon name={tab.icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
