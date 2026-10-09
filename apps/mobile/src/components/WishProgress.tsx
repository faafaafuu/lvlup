import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { BankSummary } from '@levelup/domain';
import { Icon } from '@/design/Icon';
import { useTheme } from '@/theme';
import { fmt, plural } from '@/lib/format';
import { Bar, Card, Row, T } from './ui';

/** Ближайшая реальная награда — главный мотиватор на главном экране. */
export function WishProgress({ bank }: { bank: BankSummary }) {
  const { c } = useTheme();
  const next = bank.next;
  return (
    <Pressable onPress={() => router.push('/rewards')} accessibilityLabel="Копилка">
      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={8}>
            <Icon name="coin" size={20} color={c.coin} />
            <T bold display>
              {fmt(bank.balance)} ₽
            </T>
          </Row>
          <Row gap={6}>
            <Icon name="streak" size={18} color={c.streak} />
            <T bold tone="streak">
              {bank.streak} {plural(bank.streak, 'день', 'дня', 'дней')}
            </T>
          </Row>
        </Row>
        {next ? (
          <View style={{ gap: 6 }}>
            <T>
              Копишь на: <T bold>{next.wish.title}</T> · {fmt(next.wish.price)} ₽
            </T>
            <Bar value={next.progress} max={1} color={c.coin} height={10} />
            <T size="xs" tone="muted">
              {next.daysLeft === 0
                ? 'Хватает — забирай в Копилке!'
                : next.daysLeft != null
                  ? `в таком темпе ещё ~${next.daysLeft} ${plural(next.daysLeft, 'день', 'дня', 'дней')}`
                  : 'хорошие дни приближают награду'}
            </T>
          </View>
        ) : (
          <T tone="muted">Добавь награду, на которую копишь, — кроссовки, массаж, поездку.</T>
        )}
      </Card>
    </Pressable>
  );
}
