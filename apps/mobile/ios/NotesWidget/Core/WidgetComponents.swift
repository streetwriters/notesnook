import SwiftUI
import WidgetKit

struct WidgetHeader<Accessory: View>: View {
  let title: String
  var actionIcon: String? = nil
  var actionURL: URL? = nil
  var titleURL: URL? = nil
  @ViewBuilder var accessory: () -> Accessory

  @ViewBuilder
  private var titleView: some View {
    let label = HStack(spacing: 3) {
      Text(title)
        .font(.system(size: 14, weight: .semibold))
        .foregroundColor(WidgetTheme.accent)
        .lineLimit(1)
      if titleURL != nil {
        Image(systemName: "chevron.down")
          .font(.system(size: 9, weight: .bold))
          .foregroundColor(WidgetTheme.accent)
      }
    }
    if let titleURL = titleURL {
      Link(destination: titleURL) { label }
    } else {
      label
    }
  }

  var body: some View {
    HStack(spacing: 10) {
      titleView
      Spacer(minLength: 4)
      accessory()
      if let actionIcon = actionIcon, let actionURL = actionURL {
        Link(destination: actionURL) {
          Image(systemName: actionIcon)
            .font(.system(size: 15, weight: .semibold))
            .foregroundColor(WidgetTheme.accent)
        }
      }
    }
  }
}

extension WidgetHeader where Accessory == EmptyView {
  init(title: String, actionIcon: String? = nil, actionURL: URL? = nil, titleURL: URL? = nil) {
    self.init(title: title, actionIcon: actionIcon, actionURL: actionURL, titleURL: titleURL) { EmptyView() }
  }
}

struct WidgetEmptyState: View {
  let systemImage: String
  let text: String

  var body: some View {
    VStack(spacing: 6) {
      Image(systemName: systemImage)
        .font(.system(size: 24))
        .foregroundColor(WidgetTheme.secondaryText)
      Text(text)
        .font(.system(size: 13))
        .multilineTextAlignment(.center)
        .foregroundColor(WidgetTheme.secondaryText)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}

struct WidgetRow<Trailing: View>: View {
  let title: String
  let subtitle: String
  var url: URL? = nil
  @ViewBuilder var trailing: () -> Trailing

  var body: some View {
    if let url = url {
      Link(destination: url) { content }
    } else {
      content
    }
  }

  private var content: some View {
    HStack(alignment: .center, spacing: 6) {
      VStack(alignment: .leading, spacing: 1) {
        Text(title)
          .font(.system(size: 14, weight: .semibold))
          .foregroundColor(.primary)
          .lineLimit(1)
        if !subtitle.isEmpty {
          Text(subtitle)
            .font(.system(size: 12))
            .foregroundColor(WidgetTheme.secondaryText)
            .lineLimit(1)
        }
      }
      Spacer(minLength: 0)
      trailing()
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

extension WidgetRow where Trailing == EmptyView {
  init(title: String, subtitle: String, url: URL? = nil) {
    self.init(title: title, subtitle: subtitle, url: url) { EmptyView() }
  }
}

struct WidgetList<Item: Identifiable, Row: View>: View {
  let items: [Item]
  let family: WidgetFamily
  let overflowText: (Int) -> String
  @ViewBuilder var row: (Item) -> Row

  var body: some View {
    let capacity = family.listCapacity
    let visible = Array(items.prefix(capacity))
    let hidden = items.count - visible.count

    VStack(alignment: .leading, spacing: 0) {
      ForEach(Array(visible.enumerated()), id: \.element.id) { index, item in
        if index > 0 {
          Divider().background(WidgetTheme.divider).padding(.vertical, 5)
        }
        row(item)
      }
      if hidden > 0 {
        Text(overflowText(hidden))
          .font(.system(size: 11))
          .foregroundColor(WidgetTheme.secondaryText)
          .padding(.top, 4)
      }
      Spacer(minLength: 0)
    }
  }
}

struct WidgetCard<Footer: View>: View {
  let title: String
  let body_: String
  let lineLimit: Int
  var locked: Bool = false
  @ViewBuilder var footer: () -> Footer

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 4) {
        if locked {
          Image(systemName: "lock.fill")
            .font(.system(size: 12))
            .foregroundColor(WidgetTheme.secondaryText)
        }
        Text(title)
          .font(.system(size: 15, weight: .semibold))
          .foregroundColor(.primary)
          .lineLimit(2)
      }
      if !body_.isEmpty {
        Text(body_)
          .font(.system(size: 13))
          .foregroundColor(WidgetTheme.secondaryText)
          .lineLimit(lineLimit)
      }
      Spacer(minLength: 0)
      footer()
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

extension WidgetCard where Footer == EmptyView {
  init(title: String, body_: String, lineLimit: Int, locked: Bool = false) {
    self.init(title: title, body_: body_, lineLimit: lineLimit, locked: locked) { EmptyView() }
  }
}
