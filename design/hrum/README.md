# Level Up — handoff (редизайн)

Бренд: графит + лайм, нативный iOS. Персонаж — компаньон «Лайм», растёт через 3 стадии (Росток → Побег → Древо).

| Путь | Что внутри |
|---|---|
| `tokens.json` | Дизайн-токены в запрошенной структуре (dark/light, шрифты, радиусы, отступы, тени) |
| `app-icon/` | Иконка 1024×1024: основная, тёмная и тонированная (iOS 18+). Без скругления — маску накладывает iOS |
| `companion/` | 25 SVG компаньона по слоям (`aura`, `shadow`, `feet`, `arms`, `body`, `collar`, `face` → `#eyes`, `crest`, `accessory`). Окрас перекрашивается через CSS-переменные `--body-hi / --body-mid / --body-lo / --body-deep` |
| `icons/` + `icons-sprite.svg` | 48 иконок 24×24, обводка 1,8, `currentColor`; вкладки — `*-active.svg` со сплошной заливкой |
| `animations.md` | Таблица анимаций: 19 строк |
| `strings.ru.json` | Все тексты интерфейса: 220 ключей, плейсхолдеры `{n}`, `{name}` |
| `rn/src/theme.ts` | Тема из `tokens.json` + производные цвета, `useTheme('system' \| 'dark' \| 'light')` |
| `rn/src/companion/` | `companionGeometry.ts` (тот же расчёт, что в макете) и `<Companion stage mood color crest accessory size animated onPress />` с дыханием и морганием |
| `rn/src/components/` | `Icon`, `Button`, `MicButton`, `Ring`, `LevelRing`, `XPFloat`, `TemplateChip`, `QuestRow`, `ConfirmItem`, `Toast`, `Segmented`, `TabBar` (стекло + микрофон) |

Зависимости Expo: `react-native-svg`, `expo-haptics`, `expo-blur` (на iOS 26 можно заменить на `expo-glass-effect`), `react-native-safe-area-context`, `@expo-google-fonts/geologica`.

Правила бренда:
- Тёмная тема: лаймовые акценты (#D4FF3A) на графите (#0C0C0E).
- Светлая тема: кнопки чернильные (#111113) с лаймовым текстом, кольца и полосы — чернилами.
- «Чуть выше плана» показываем нейтральным серым, не красным.
