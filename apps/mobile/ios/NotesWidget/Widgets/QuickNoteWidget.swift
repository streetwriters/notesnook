import SwiftUI
import WidgetKit

struct QuickNoteSource: WidgetDataSource {
  static let placeholder: Void = ()
  static func load() {}
}

struct QuickNoteView: View {
  @Environment(\.widgetFamily) private var family
  let entry: WidgetEntry<Void>

  var body: some View {
    content
      .widgetURL(WidgetLink.newNote)
      .widgetBackground()
  }

  @ViewBuilder
  private var content: some View {
    if #available(iOS 16.0, *), family == .accessoryCircular {
      ZStack {
        AccessoryWidgetBackground()
        Image(systemName: "square.and.pencil").font(.system(size: 22, weight: .semibold))
      }
    } else if family == .systemMedium {
      HStack(spacing: 14) {
        icon(size: 36)
        VStack(alignment: .leading, spacing: 2) {
          Text(entry.strings[.quickNote]).font(.system(size: 16, weight: .semibold))
          Text(entry.strings[.addQuickNote])
            .font(.system(size: 13))
            .foregroundColor(WidgetTheme.secondaryText)
        }
        Spacer(minLength: 0)
      }
    } else {
      VStack(spacing: 10) {
        icon(size: 40)
        Text(entry.strings[.addQuickNote])
          .font(.system(size: 14))
          .multilineTextAlignment(.center)
      }
    }
  }

  private func icon(size: CGFloat) -> some View {
    Image(systemName: "plus.circle.fill")
      .font(.system(size: size))
      .foregroundColor(WidgetTheme.accent)
  }
}

struct QuickNoteWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: WidgetKind.quickNote, provider: StoreProvider<QuickNoteSource>()) { entry in
      QuickNoteView(entry: entry)
    }
    .configurationDisplayName("Quick Note")
    .description("A widget to add notes quickly.")
    .supportedFamilies(WidgetFamilies.withLockScreenCircular([.systemSmall, .systemMedium]))
  }
}
