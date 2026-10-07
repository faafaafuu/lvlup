# Level Up — handoff

| Путь | Что внутри |
|---|---|
| `tokens.json` | Дизайн-токены (dark/light, шрифты, радиусы, отступы, тени) — в запрошенной структуре |
| `hero/` | SVG героя по слоям: `hero-{m\|f}-stage-{0..2}-{idle\|cheer\|wave}.svg`, варианты аксессуаров и причёсок. Цвета — `var(--skin)`, `var(--outfit-top)`, `var(--outfit-bottom)`, `var(--hair)`, `var(--ink)`, `var(--shoes)`, `var(--accessory)` с фолбэком |
| `icons/` + `icons-sprite.svg` | 42 иконки 24×24, stroke 2, `currentColor`; таб-бар — `*-active.svg` с заливкой 22% |
| `animations.md` | Таблица анимаций |
| `strings.ru.json` | Все тексты интерфейса (194 ключа, плейсхолдеры `{n}`) |
| `rn/src/theme.ts` | Тема из `tokens.json` + производные цвета, `useTheme('system'\|'dark'\|'light')` |
| `rn/src/hero/heroGeometry.ts` | Геометрия героя (чистые функции → path). Единый источник для SVG и RN |
| `rn/src/hero/Hero.tsx` | `<Hero gender stage pose hair accessory colors size animated onPress/>`, дыхание 3 с + моргание 4–6 с, `accessoryForLevel()` |
| `rn/src/components/` | `Icon`, `Button`, `MicButton`, `XPBar`, `XPFloat`, `LevelBadge`, `TemplateChip`, `QuestCard`, `ConfirmItem`, `Toast`, `RewardModal` |

Зависимости Expo: `react-native-svg`, `expo-haptics`, `@expo-google-fonts/unbounded` (запасной вариант — `@expo-google-fonts/rubik`).

Слои героя (снизу вверх): `accessory-back` (добавлен: спина плаща и аура должны быть позади тела), `shadow`, `legs`, `body`, `outfit-bottom`, `outfit-top`, `arms`, `head`, `face` (внутри `#eyes` для моргания), `hair`, `accessory`.
