import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAKE_WIN_BONUS, canClaim, rateOn } from '@levelup/domain';
import { Bar, Btn, Card, Chip, Row, SectionTitle, Stepper, T, textInputStyle } from '@/components/ui';
import { Icon } from '@/design/Icon';
import { fmt, plural } from '@/lib/format';
import { useStore } from '@/state/store';
import { useToday } from '@/state/useToday';
import { useTheme } from '@/theme';

export default function PiggyScreen() {
  const { c } = useTheme();
  const game = useToday();
  const m = useStore((s) => s.motivation);
  const actions = useStore.getState();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stakeAmount, setStakeAmount] = useState(500);
  const [stakeTarget, setStakeTarget] = useState(5);
  const [recipient, setRecipient] = useState('');
  if (!game) return null;
  const { bank } = game;
  const rate = rateOn(m.rates, game.today);
  const open = m.wishes.filter((w) => !w.claimedAt).sort((a, b) => a.price - b.price);
  const claimed = m.wishes.filter((w) => w.claimedAt);
  const currentStake = bank.stakes.find((s) => s.stake.weekStart <= game.today && s.state === 'active');
  const debts = bank.stakes.filter((s) => s.state === 'lost' && !s.stake.paidAt);
  const wins = bank.stakes.filter((s) => s.state === 'won');

  const addWish = () => {
    const p = Number(price.replace(/\s/g, ''));
    if (!title.trim() || !(p > 0)) return;
    actions.addWish(title.trim(), p);
    setTitle('');
    setPrice('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <T size="xl" bold display>
          Копилка
        </T>

        <Card style={{ gap: 6 }}>
          <T size="xs" tone="muted">
            Заработано хорошими днями
          </T>
          <T size="xxl" bold display tone="coin" numberOfLines={1} adjustsFontSizeToFit>
            {fmt(bank.balance)} ₽
          </T>
          <T tone="muted">{fmt(rate)} ₽ за идеальный день · серия {bank.streak} {plural(bank.streak, 'день', 'дня', 'дней')}</T>
          <T size="xs" tone="muted">
            Деньги твои: копилка показывает, сколько ты разрешил себе потратить на награды.
          </T>
        </Card>

        {debts.map((d) => (
          <Card key={d.stake.id} style={{ gap: 8, borderColor: c.warning }}>
            <T bold>Ставка проиграна: {d.goodDays} из {d.stake.target} хороших дней</T>
            <T>
              Уговор есть уговор — переведи <T bold>{fmt(d.stake.amount)} ₽</T> → {d.stake.recipient}.
            </T>
            <Btn title="Перевёл" onPress={() => actions.payStake(d.stake.id)} />
          </Card>
        ))}

        {bank.toTransfer > 0 && (
          <Card style={{ gap: 8 }}>
            <Row gap={8}>
              <Icon name="download" size={20} color={c.primary} />
              <T bold style={{ flex: 1 }}>
                Сделай копилку настоящей
              </T>
            </Row>
            <T size="sm" tone="muted">
              Переведи {fmt(bank.toTransfer)} ₽ на отдельный счёт или в банковскую «копилку». Тогда награда будет оплачена заранее — и её не жалко забрать.
            </T>
            <Btn title={`Перевёл ${fmt(bank.toTransfer)} ₽`} kind="ghost" onPress={() => actions.addTransfer(bank.toTransfer)} />
          </Card>
        )}

        <SectionTitle>Награды</SectionTitle>
        {open.length === 0 && <T tone="muted">Добавь то, что правда хочешь: кроссовки, массаж, игру, поездку.</T>}
        {open.map((w) => {
          const can = canClaim(bank, w);
          return (
            <Card key={w.id} style={{ gap: 8 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T bold style={{ flex: 1 }}>
                  {w.title}
                </T>
                <T bold>{fmt(w.price)} ₽</T>
              </Row>
              <Bar value={Math.max(0, bank.balance)} max={w.price} color={c.coin} height={8} />
              <Row>
                <Btn
                  title={can ? 'Забрать награду' : `Ещё ${fmt(w.price - Math.max(0, bank.balance))} ₽`}
                  disabled={!can}
                  style={{ flex: 1 }}
                  onPress={() =>
                    Alert.alert(w.title, `Списать ${fmt(w.price)} ₽ из копилки и купить себе награду?`, [
                      { text: 'Не сейчас', style: 'cancel' },
                      { text: 'Забираю!', onPress: () => actions.claimWish(w.id) },
                    ])
                  }
                />
                <Pressable accessibilityLabel={`Удалить ${w.title}`} hitSlop={8} onPress={() => actions.removeWish(w.id)} style={{ padding: 8 }}>
                  <Icon name="trash" size={20} color={c.textMuted} />
                </Pressable>
              </Row>
            </Card>
          );
        })}
        <Card style={{ gap: 8 }}>
          <T bold>Новая награда</T>
          <TextInput value={title} onChangeText={setTitle} placeholder="Например: новые кроссовки" placeholderTextColor={c.textMuted} style={textInputStyle(c)} />
          <Row>
            <TextInput value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="Цена, ₽" placeholderTextColor={c.textMuted} style={[textInputStyle(c), { flex: 1, minWidth: 0 }]} />
            <Btn title="Добавить" onPress={addWish} disabled={!title.trim() || !(Number(price) > 0)} style={{ paddingHorizontal: 20 }} />
          </Row>
        </Card>

        <SectionTitle>Ставка на себя</SectionTitle>
        {currentStake ? (
          <Card style={{ gap: 8 }}>
            <T bold>
              {fmt(currentStake.stake.amount)} ₽ на {currentStake.stake.target} хороших {plural(currentStake.stake.target, 'день', 'дня', 'дней')} этой недели
            </T>
            <Bar value={currentStake.goodDays} max={currentStake.stake.target} color={currentStake.reachable ? c.primary : c.warning} height={10} />
            <T size="sm" tone="muted">
              {currentStake.goodDays} из {currentStake.stake.target} · осталось {currentStake.daysLeft} {plural(currentStake.daysLeft, 'день', 'дня', 'дней')}
              {currentStake.reachable ? '' : ' · уже не успеть, но держись'}
            </T>
            <T size="sm">
              Выиграешь — +{fmt(Math.round(currentStake.stake.amount * STAKE_WIN_BONUS))} ₽ в копилку. Проиграешь — {fmt(currentStake.stake.amount)} ₽ → {currentStake.stake.recipient}.
            </T>
          </Card>
        ) : (
          <Card style={{ gap: 10 }}>
            <T size="sm" tone="muted">
              Поставь на эту неделю сумму. Не наберёшь нужное число хороших дней — отдаёшь её другу или на благотворительность. Страх потерять деньги работает сильнее любых баллов.
            </T>
            <Row style={{ justifyContent: 'space-between' }}>
              <T>Сумма</T>
              <Stepper value={stakeAmount} step={100} min={100} suffix=" ₽" onChange={setStakeAmount} />
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <T>Хороших дней из 7</T>
              <Stepper value={stakeTarget} step={1} min={1} onChange={(v) => setStakeTarget(Math.min(7, v))} />
            </Row>
            <TextInput value={recipient} onChangeText={setRecipient} placeholder="Кому отдашь при проигрыше (друг, фонд)" placeholderTextColor={c.textMuted} style={textInputStyle(c)} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['Другу', 'Близкому человеку', 'В благотворительный фонд'].map((r) => (
                <Chip key={r} label={r} active={recipient === r} onPress={() => setRecipient(r)} />
              ))}
            </View>
            <Btn
              title="Поставить"
              disabled={!recipient.trim()}
              onPress={() => {
                const err = actions.addStake({ amount: stakeAmount, target: stakeTarget, recipient: recipient.trim() });
                if (err) Alert.alert('Не получилось', err);
              }}
            />
          </Card>
        )}
        {wins.length > 0 && (
          <T size="sm" tone="success">
            Выиграно ставок: {wins.length}
          </T>
        )}

        {claimed.length > 0 && (
          <>
            <SectionTitle>Уже забрал</SectionTitle>
            {claimed.map((w) => (
              <Row key={w.id} style={{ justifyContent: 'space-between' }}>
                <Row gap={8}>
                  <Icon name="medal" size={18} color={c.coin} />
                  <T>{w.title}</T>
                </Row>
                <T tone="muted">{fmt(w.price)} ₽</T>
              </Row>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
