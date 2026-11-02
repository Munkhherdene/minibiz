import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Icon } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { mn } from '@/i18n/mn';
import type { LocalImage } from '@/lib/storage';

export type PickedImage = LocalImage & { uri: string };

/** `undefined` = image unchanged, `null` = removed, otherwise a newly picked image. */
export type ImageChange = PickedImage | null | undefined;

const MAX_BYTES = 5 * 1024 * 1024;

/** Optional square image (business logo, product photo) picked from the gallery. */
export function ImageField({
  label,
  addLabel,
  changeLabel,
  removeLabel,
  imageUri,
  onPick,
  onRemove,
  onError,
  disabled = false,
}: {
  label: string;
  addLabel: string;
  changeLabel: string;
  removeLabel: string;
  imageUri: string | null;
  onPick: (image: PickedImage) => void;
  onRemove: () => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) return;
    // base64 is ~4/3 of the byte size.
    if ((asset.fileSize ?? (asset.base64.length * 3) / 4) > MAX_BYTES) {
      onError(mn.errors.imageTooLarge);
      return;
    }
    onPick({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType ?? 'image/jpeg' });
  }

  return (
    <View style={styles.field}>
      <AppText variant="label">
        {label} ({mn.common.optional})
      </AppText>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={imageUri ? changeLabel : addLabel}
          disabled={disabled}
          onPress={pick}
          style={({ pressed }) => [styles.preview, pressed && styles.pressed]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <Icon name="photo" size={28} color={colors.primary} />
          )}
        </Pressable>
        <View style={styles.actions}>
          <Button
            title={imageUri ? changeLabel : addLabel}
            variant="secondary"
            disabled={disabled}
            onPress={pick}
          />
          {imageUri ? (
            <Button title={removeLabel} variant="ghost" disabled={disabled} onPress={onRemove} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs + 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  preview: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  pressed: { opacity: 0.7 },
  actions: { flex: 1, gap: spacing.xs },
});
