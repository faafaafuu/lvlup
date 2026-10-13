import ActivityKit
import ExpoModulesCore

/// Копия структуры из targets/widget/Shared.swift: ActivityKit сопоставляет их по имени типа.
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

/// Одна активность на всё время: «День» и «Слушаю» — это её состояния, а не разные активности.
public class HrumActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HrumActivity")

    Function("isSupported") { () -> Bool in
      if #available(iOS 16.2, *) { return ActivityAuthorizationInfo().areActivitiesEnabled }
      return false
    }

    AsyncFunction("show") { (kcalLeft: Int, food: Double, steps: Double, xp: Double, listening: Bool) in
      guard #available(iOS 16.2, *) else { return }
      let current = Activity<HrumActivityAttributes>.activities.first
      // Таймер «Слушаю» отсчитывается от начала записи — не сбрасываем его на каждом обновлении.
      let since = (listening && current?.content.state.listening == true) ? current!.content.state.since : Date()
      let state = HrumActivityAttributes.ContentState(
        kcalLeft: kcalLeft, food: food, steps: steps, xp: xp, listening: listening, since: since)
      let content = ActivityContent(state: state, staleDate: nil)
      if let activity = current {
        await activity.update(content)
      } else {
        _ = try? Activity.request(attributes: HrumActivityAttributes(name: "Хрум"), content: content, pushType: nil)
      }
    }

    AsyncFunction("end") {
      guard #available(iOS 16.2, *) else { return }
      for activity in Activity<HrumActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }
}
