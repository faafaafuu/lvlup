import ActivityKit
import SwiftUI
import WidgetKit

/// Dynamic Island и экран блокировки: «День» (кольца + остаток) и «Слушаю» (волна + таймер).
struct HrumLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: HrumActivityAttributes.self) { context in
      LockScreenView(state: context.state)
        .activityBackgroundTint(Palette.bg)
        .activitySystemActionForegroundColor(.white)
        .widgetURL(URL(string: "levelup://"))
    } dynamicIsland: { context in
      let s = context.state
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          RingsView(food: s.food, steps: s.steps, xp: s.xp, size: 52).padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          VStack(alignment: .trailing, spacing: 2) {
            if s.listening {
              Text(timerInterval: s.since...Date.distantFuture, countsDown: false)
                .font(.system(size: 22, weight: .light, design: .monospaced)).monospacedDigit()
                .frame(maxWidth: 90, alignment: .trailing)
              Lbl(text: "слушаю")
            } else {
              Text(formatKcal(s.kcalLeft)).font(.system(size: 26, weight: .light)).foregroundColor(Palette.food)
              Lbl(text: s.kcalLeft >= 0 ? "ккал осталось" : "сверх плана")
            }
          }
          .padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          if !s.listening {
            Link(destination: URL(string: "levelup://voice")!) {
              HStack(spacing: 8) {
                Image(systemName: "mic.fill")
                Text("Записать").font(.system(size: 15, weight: .semibold))
              }
              .foregroundColor(.white)
              .frame(maxWidth: .infinity, minHeight: 40)
              .background(Capsule().fill(Palette.xp))
            }
          }
        }
      } compactLeading: {
        if s.listening {
          Image(systemName: "waveform").foregroundStyle(LinearGradient(colors: [Palette.food, Palette.steps, Palette.xp], startPoint: .leading, endPoint: .trailing))
        } else {
          RingsView(food: s.food, steps: s.steps, xp: s.xp, size: 22)
        }
      } compactTrailing: {
        if s.listening {
          Text(timerInterval: s.since...Date.distantFuture, countsDown: false)
            .font(.system(size: 14, weight: .medium, design: .monospaced)).monospacedDigit()
            .frame(maxWidth: 46)
        } else {
          Text(formatKcal(s.kcalLeft)).font(.system(size: 15, weight: .medium)).foregroundColor(Palette.food)
        }
      } minimal: {
        if s.listening {
          Image(systemName: "waveform").foregroundColor(Palette.steps)
        } else {
          RingsView(food: s.food, steps: s.steps, xp: s.xp, size: 22)
        }
      }
      .widgetURL(URL(string: "levelup://"))
      .keylineTint(Palette.food)
    }
  }
}

private struct LockScreenView: View {
  let state: HrumActivityAttributes.ContentState

  var body: some View {
    HStack(spacing: 16) {
      RingsView(food: state.food, steps: state.steps, xp: state.xp, size: 56)
      VStack(alignment: .leading, spacing: 2) {
        if state.listening {
          Text(timerInterval: state.since...Date.distantFuture, countsDown: false)
            .font(.system(size: 28, weight: .light, design: .monospaced)).monospacedDigit().foregroundColor(.white)
          Lbl(text: "Хрум слушает")
        } else {
          Text(formatKcal(state.kcalLeft)).font(.system(size: 30, weight: .light)).foregroundColor(.white)
          Lbl(text: state.kcalLeft >= 0 ? "ккал осталось" : "ккал сверх плана")
        }
      }
      Spacer()
      if !state.listening {
        Link(destination: URL(string: "levelup://voice")!) {
          Image(systemName: "mic.fill").font(.system(size: 18, weight: .semibold)).foregroundColor(.white)
            .frame(width: 48, height: 48).background(Circle().fill(Palette.xp))
        }
      }
    }
    .padding(16)
  }
}
