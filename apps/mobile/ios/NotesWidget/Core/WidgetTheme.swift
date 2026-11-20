import SwiftUI
import WidgetKit

private struct ThemePalette: Decodable {
  let light: String?
  let dark: String?
}

enum WidgetHex {
  static func rgb(_ value: String?) -> (red: Double, green: Double, blue: Double)? {
    guard let value = value else { return nil }
    let hex = value.hasPrefix("#") ? String(value.dropFirst()) : value
    guard hex.count == 6, let number = UInt32(hex, radix: 16) else { return nil }
    return (
      Double((number >> 16) & 0xFF) / 255,
      Double((number >> 8) & 0xFF) / 255,
      Double(number & 0xFF) / 255
    )
  }

  static func color(_ value: String?) -> Color? {
    rgb(value).map { Color(red: $0.red, green: $0.green, blue: $0.blue) }
  }
}

private extension UIColor {
  convenience init?(hex value: String?) {
    guard let rgb = WidgetHex.rgb(value) else { return nil }
    self.init(red: CGFloat(rgb.red), green: CGFloat(rgb.green), blue: CGFloat(rgb.blue), alpha: 1)
  }
}

enum WidgetTheme {
  static var accent: Color {
    let palette = WidgetStore.decode(ThemePalette.self, forKey: WidgetKey.theme)
    let light = UIColor(hex: palette?.light)
    let dark = UIColor(hex: palette?.dark)
    return Color(
      uiColor: UIColor { traits in
        (traits.userInterfaceStyle == .dark ? dark : light)
          ?? UIColor(named: "AccentColor", in: nil, compatibleWith: traits)
          ?? .systemGreen
      }
    )
  }
  static let background = Color("WidgetBackground")
  static let divider = Color.primary.opacity(0.12)
  static let secondaryText = Color.secondary
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
