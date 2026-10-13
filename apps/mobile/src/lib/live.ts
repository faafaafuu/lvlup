import { Platform } from 'react-native';
import { ExtensionStorage } from '@bacons/apple-targets';
import { XP_PER_LEVEL, dateKey, dayStats, gameSummary, normOn } from '@levelup/domain';
import { HrumActivity } from '../../modules/hrum-activity';
import { useStore } from '@/state/store';

/** Должна совпадать с entitlements в app.json и hrumAppGroup в targets/widget/Shared.swift. */
const APP_GROUP = 'group.com.faraday13.levelup';
const storage = Platform.OS === 'ios' ? new ExtensionStorage(APP_GROUP) : null;

let recording = false;
let lastSnapshot = '';
let lastIsland = '';

/** Снимок «сегодня» для виджетов (JSON-строка — так его читает HrumDay.load()). */
function snapshot() {
  const s = useStore.getState();
  if (!s.profile) return null;
  const today = dateKey(new Date());
  const state = { profile: s.profile, meals: s.meals, activity: s.activity, weights: s.weights };
  const stats = dayStats(today, s.meals, s.activity[today]);
  const game = gameSummary(state);
  return {
    kcal: Math.round(stats.kcal),
    norm: Math.round(normOn(state, today)),
    steps: Math.round(stats.steps),
    stepsGoal: s.profile.stepsGoal,
    level: game.level,
    levelXp: game.levelXp,
    date: today,
  };
}

/** Обновить виджеты и островок; вызывается на каждое изменение стора и старт/стоп записи. */
export function syncLive() {
  if (!storage) return;
  const day = snapshot();
  if (!day) return;

  const json = JSON.stringify(day);
  if (json !== lastSnapshot) {
    lastSnapshot = json;
    storage.set('today', json);
    ExtensionStorage.reloadWidget();
  }

  if (!HrumActivity) return;
  const enabled = useStore.getState().settings.island !== false;
  const share = (a: number, b: number) => (b > 0 ? Math.min(1, a / b) : 0);
  const args = [day.norm - day.kcal, share(day.kcal, day.norm), share(day.steps, day.stepsGoal), day.levelXp / XP_PER_LEVEL, recording] as const;
  const key = enabled ? JSON.stringify(args) : 'off';
  if (key === lastIsland) return;
  lastIsland = key;
  void (enabled ? HrumActivity.show(...args) : HrumActivity.end()).catch(() => {});
}

export function setRecording(on: boolean) {
  recording = on;
  syncLive();
}

/** Подписка на стор — один раз из корневого layout. */
export function startLiveSync() {
  syncLive();
  return useStore.subscribe(syncLive);
}
