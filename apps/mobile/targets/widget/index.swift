import SwiftUI
import WidgetKit

@main
struct HrumWidgetBundle: WidgetBundle {
  var body: some Widget {
    RingsWidget()
    KcalWidget()
    HrumLiveActivity()
  }
}
