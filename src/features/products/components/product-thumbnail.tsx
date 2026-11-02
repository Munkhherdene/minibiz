import { Image, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { assetUrl } from '@/lib/storage';

export function ProductThumbnail({ imagePath, size = 48 }: { imagePath: string | null; size?: number }) {
  const box = { width: size, height: size };
  if (imagePath) {
    return <Image source={{ uri: assetUrl(imagePath) }} style={[styles.box, box]} />;
  }
  return (
    <View style={[styles.box, styles.placeholder, box]}>
      <Icon name="products" size={size / 2} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
