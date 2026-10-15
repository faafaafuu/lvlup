import { BottomNav } from '@/components/BottomNav';
import { Pager } from '@/components/Pager';
import { DiaryPage } from '@/screens/DiaryPage';
import { HomePage } from '@/screens/HomePage';
import { ProgressPage } from '@/screens/ProgressPage';

/** Главный: дневник ← сегодня → прогресс, листается свайпом; кнопки внизу общие. */
export default function Main() {
  return <Pager pages={[<DiaryPage key="d" />, <HomePage key="h" />, <ProgressPage key="p" />]} overlay={<BottomNav />} />;
}
