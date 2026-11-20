import SwiftUI
import WidgetKit

enum WidgetTheme {
  static let accent = Color("AccentColor")
  static let background = Color("WidgetBackground")
  static let divider = Color.primary.opacity(0.12)
  static let secondaryText = Color.secondary
  static let rowSpacing: CGFloat = 8
}

extension View {
  @ViewBuilder
  func widgetBackground() -> some View {
    if #available(iOS 17.0, *) {
      containerBackground(for: .widget) { WidgetTheme.background }
    } else {
      padding(16).background(WidgetTheme.background)
    }
  }
}

extension WidgetFamily {
  var listCapacity: Int {
    switch self {
    case .systemSmall: return 1
    case .systemMedium: return 3
    case .systemLarge: return 7
    default: return 7
    }
  }

  var previewLineLimit: Int {
    switch self {
    case .systemSmall: return 4
    case .systemMedium: return 4
    case .systemLarge: return 14
    default: return 14
    }
  }
}

enum WidgetFamilies {
  static func withLockScreenCircular(_ system: [WidgetFamily]) -> [WidgetFamily] {
    if #available(iOS 16.0, *) { return system + [.accessoryCircular] }
    return system
  }
}
