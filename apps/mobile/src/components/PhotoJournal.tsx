import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '@/design/Icon';
import { humanDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';
import { Btn, Card, Row, T } from './ui';

/** Фото прогресса: хранятся только в телефоне, в папке приложения. Первое и последнее — рядом. */
export function PhotoJournal({ today }: { today: string }) {
  const { c } = useTheme();
  const photos = useStore((s) => s.photos);
  const addPhoto = useStore((s) => s.addPhoto);
  const removePhoto = useStore((s) => s.removePhoto);
  const sorted = [...photos].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const take = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Нет доступа', camera ? 'Разреши камеру в Настройках iPhone.' : 'Разреши доступ к фото в Настройках iPhone.');
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [3, 4] };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    const asset = res.canceled ? null : res.assets[0];
    if (!asset) return;
    try {
      const dir = new Directory(Paths.document, 'progress');
      if (!dir.exists) dir.create({ intermediates: true });
      const dest = new File(dir, `${Date.now()}.jpg`);
      await new File(asset.uri).copy(dest);
      addPhoto(dest.uri);
    } catch (e) {
      Alert.alert('Не сохранилось', e instanceof Error ? e.message : String(e));
    }
  };

  const ask = () =>
    Alert.alert('Фото прогресса', 'Одинаковый ракурс и свет раз в неделю — лучший способ увидеть изменения, которые не видны в зеркале.', [
      { text: 'Камера', onPress: () => void take(true) },
      { text: 'Из галереи', onPress: () => void take(false) },
      { text: 'Отмена', style: 'cancel' },
    ]);

  return (
    <Card style={{ gap: 12 }}>
      {first && last && first.id !== last.id ? (
        <Row gap={10}>
          {[first, last].map((p, i) => (
            <View key={p.id} style={{ flex: 1, gap: 4 }}>
              <Image source={{ uri: p.uri }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: c.surfaceAlt }} />
              <T size="xs" tone="muted" style={{ textAlign: 'center' }}>
                {i === 0 ? 'Было' : 'Сейчас'} · {humanDate(p.date, today)}
              </T>
            </View>
          ))}
        </Row>
      ) : (
        <T tone="muted">Сделай первое фото — через месяц будет с чем сравнить.</T>
      )}
      {sorted.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {sorted.map((p) => (
            <Pressable
              key={p.id}
              onLongPress={() =>
                Alert.alert('Удалить фото?', humanDate(p.date, today), [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Удалить', style: 'destructive', onPress: () => removePhoto(p.id) },
                ])
              }
            >
              <Image source={{ uri: p.uri }} style={{ width: 60, height: 80, borderRadius: 8, backgroundColor: c.surfaceAlt }} />
            </Pressable>
          ))}
        </ScrollView>
      )}
      <Row gap={8}>
        <Icon name="user" size={18} color={c.textMuted} />
        <T size="xs" tone="muted" style={{ flex: 1 }}>
          Фото не покидают телефон. Долгое нажатие — удалить.
        </T>
      </Row>
      <Btn title="Добавить фото" kind="ghost" onPress={ask} />
    </Card>
  );
}
