import ActivityKit
import SwiftUI
import WidgetKit

/// Общая группа приложения и виджета — сюда приложение пишет «сегодня» (ExtensionStorage).
let hrumAppGroup = "group.com.faraday13.levelup"

/// Снимок дня, который приложение кладёт в общую группу.
struct HrumDay: Codable {
  var kcal: Int
  var norm: Int
  var steps: Int
  var stepsGoal: Int
  var level: Int
  var levelXp: Int
  var date: String

  var left: Int { norm - kcal }
  var food: Double { norm > 0 ? Double(kcal) / Double(norm) : 0 }
  var stepsShare: Double { stepsGoal > 0 ? Double(steps) / Double(stepsGoal) : 0 }
  var xp: Double { Double(levelXp) / 1000 }

  static let placeholder = HrumDay(kcal: 1240, norm: 1900, steps: 5400, stepsGoal: 8000, level: 4, levelXp: 340, date: "")

  static func load() -> HrumDay? {
    guard let raw = UserDefaults(suiteName: hrumAppGroup)?.string(forKey: "today"),
          let data = raw.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(HrumDay.self, from: data)
  }
}

/// Должна совпадать с HrumActivityAttributes в модуле приложения (modules/hrum-activity).
struct HrumActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var kcalLeft: Int
    var food: Double
    var steps: Double
    var xp: Double
    var listening: Bool
    var since: Date
  }

  var name: String
}

/// Цвета тёмной темы «Анфилада».
enum Palette {
  static let bg = Color(red: 10 / 255, green: 10 / 255, blue: 12 / 255)
  static let food = Color(red: 30 / 255, green: 134 / 255, blue: 240 / 255)
  static let steps = Color(red: 142 / 255, green: 91 / 255, blue: 240 / 255)
  static let xp = Color(red: 232 / 255, green: 32 / 255, blue: 42 / 255)
  static let track = Color.white.opacity(0.08)
  static let muted = Color(red: 138 / 255, green: 138 / 255, blue: 147 / 255)
}

/// Три кольца из макета: еда, шаги, опыт. Обычные — как на главном (320 / 16·7·3, отступы 0·24·38),
/// жирные — как в виджете и на иконке (248 / 24·16·8, отступы 0·29·51).
struct RingsView: View {
  var food: Double
  var steps: Double
  var xp: Double
  var size: CGFloat
  var bold = false

  var body: some View {
    let k = size / (bold ? 248 : 320)
    let w: [CGFloat] = bold ? [24, 16, 8] : [16, 7, 3]
    let inset: [CGFloat] = bold ? [0, 29, 51] : [0, 24, 38]
    ZStack {
      ring(food, Palette.food, w[0] * k, inset[0] * k)
      ring(steps, Palette.steps, w[1] * k, inset[1] * k)
      ring(xp, Palette.xp, w[2] * k, inset[2] * k)
    }
    .frame(width: size, height: size)
  }

  private func ring(_ value: Double, _ color: Color, _ width: CGFloat, _ inset: CGFloat) -> some View {
    ZStack {
      Circle().stroke(Palette.track, lineWidth: width)
      Circle()
        .trim(from: 0, to: max(0.002, min(1, value)))
        .stroke(color, style: StrokeStyle(lineWidth: width, lineCap: .round))
        .rotationEffect(.degrees(-90))
    }
    .padding(inset + width / 2)
  }
}

/// Моноширинная подпись капслоком, как в макете.
struct Lbl: View {
  var text: String
  var size: CGFloat = 9
  var body: some View {
    Text(text.uppercased())
      .font(.system(size: size, weight: .regular, design: .monospaced))
      .tracking(1.2)
      .foregroundColor(Palette.muted)
  }
}

func formatKcal(_ n: Int) -> String {
  let f = NumberFormatter()
  f.numberStyle = .decimal
  f.groupingSeparator = " "
  return f.string(from: NSNumber(value: abs(n))) ?? "\(abs(n))"
}

extension View {
  /// iOS 17 требует фон контейнера; на 16.x — обычный фон.
  @ViewBuilder func hrumBackground() -> some View {
    if #available(iOS 17.0, *) {
      containerBackground(for: .widget) { Palette.bg }
    } else {
      background(Palette.bg)
    }
  }
}
