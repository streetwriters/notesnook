import Foundation
import WidgetKit

@objc(NNWidgets)
class NNWidgets: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(reload:)
  func reload(_ kinds: [String]) {
    let targets = kinds.isEmpty ? WidgetKind.all : kinds
    for kind in targets {
      WidgetCenter.shared.reloadTimelines(ofKind: kind)
    }
  }
}
