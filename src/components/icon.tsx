import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

// SF Symbols on iOS, Material Symbols on Android and web.
const icons = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  inbox: { ios: 'tray', android: 'inbox', web: 'inbox' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  logout: {
    ios: 'rectangle.portrait.and.arrow.right',
    android: 'logout',
    web: 'logout',
  },
} as const;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 24,
  color,
}: {
  name: IconName;
  size?: number;
  color: ColorValue;
}) {
  return <SymbolView name={icons[name]} size={size} tintColor={color} />;
}
