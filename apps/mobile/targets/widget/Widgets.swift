import SwiftUI
import WidgetKit

struct DayEntry: TimelineEntry {
  let date: Date
  let day: HrumDay
}

struct DayProvider: TimelineProvider {
  func placeholder(in context: Context) -> DayEntry { DayEntry(date: Date(), day: .placeholder) }

  func getSnapshot(in context: Context, completion: @escaping (DayEntry) -> Void) {
    completion(DayEntry(date: Date(), day: HrumDay.load() ?? .placeholder))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<DayEntry>) -> Void) {
    // Приложение само перезагружает виджет после каждой записи; это — страховка раз в полчаса.
    let entry = DayEntry(date: Date(), day: HrumDay.load() ?? .placeholder)
    completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(30 * 60))))
  }
}

/// «Кольца»: три кольца и остаток калорий в центре.
struct RingsWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: DayEntry

  var body: some View {
    let d = entry.day
    switch family {
    case .accessoryCircular:
      ZStack {
        RingsView(food: d.food, steps: d.stepsShare, xp: d.xp, size: 58, bold: true)
        Text(formatKcal(d.left)).font(.system(size: 11, weight: .medium))
      }
      .widgetURL(URL(string: "levelup://"))
    default:
      ZStack {
        RingsView(food: d.food, steps: d.stepsShare, xp: d.xp, size: 140, bold: true)
        VStack(spacing: 2) {
          Text(formatKcal(d.left)).font(.system(size: 24, weight: .light)).foregroundColor(.white).minimumScaleFactor(0.6).lineLimit(1).frame(maxWidth: 70)
          Lbl(text: d.left >= 0 ? "ккал" : "сверх")
        }
      }
      .widgetURL(URL(string: "levelup://"))
      .hrumBackground()
    }
  }
}

struct RingsWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "HrumRings", provider: DayProvider()) { entry in
      RingsWidgetView(entry: entry)
    }
    .configurationDisplayName("Кольца")
    .description("Еда, шаги и опыт за сегодня.")
    .supportedFamilies([.systemSmall, .accessoryCircular])
  }
}

/// «Остаток»: сколько ккал осталось и кнопка микрофона — тап сразу открывает запись голосом.
struct KcalWidgetView: View {
  let entry: DayEntry

  var body: some View {
    let d = entry.day
    VStack(alignment: .leading, spacing: 0) {
      Text(formatKcal(d.left)).font(.system(size: 34, weight: .light)).foregroundColor(.white)
      Lbl(text: d.left >= 0 ? "ккал осталось" : "ккал сверх плана")
      Spacer()
      HStack {
        Spacer()
        Image(systemName: "mic.fill").font(.system(size: 18, weight: .semibold)).foregroundColor(.white)
        Spacer()
      }
      .frame(height: 44)
      .background(Capsule().fill(Palette.xp))
    }
    .padding(2)
    .widgetURL(URL(string: "levelup://voice"))
    .hrumBackground()
  }
}

struct KcalWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "HrumKcal", provider: DayProvider()) { entry in
      KcalWidgetView(entry: entry)
    }
    .configurationDisplayName("Остаток и запись")
    .description("Сколько ккал осталось и кнопка записи голосом.")
    .supportedFamilies([.systemSmall])
  }
}
