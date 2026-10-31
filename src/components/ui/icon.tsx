import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

// SF Symbols on iOS, Material Symbols on Android and web.
const icons = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  products: { ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' },
  sales: { ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' },
  finance: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  warning: {
    ios: 'exclamationmark.triangle',
    android: 'warning',
    web: 'warning',
  },
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
