import SwiftUI

struct WidgetBlocksView: View {
  let blocks: [NoteBlock]

  var body: some View {
    VStack(alignment: .leading, spacing: 5) {
      ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
        row(block)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .clipped()
    .mask(
      LinearGradient(
        stops: [
          .init(color: .black, location: 0),
          .init(color: .black, location: 0.88),
          .init(color: .clear, location: 1)
        ],
        startPoint: .top,
        endPoint: .bottom
      )
    )
  }

  private func inline(_ spans: [Span]) -> Text {
    var result = AttributedString()
    for span in spans {
      var part = AttributedString(span.text)
      var intent: InlinePresentationIntent = []
      if span.bold { intent.insert(.stronglyEmphasized) }
      if span.italic { intent.insert(.emphasized) }
      if span.code { intent.insert(.code) }
      if !intent.isEmpty { part.inlinePresentationIntent = intent }
      if span.strike { part.strikethroughStyle = .single }
      if span.underline { part.underlineStyle = .single }
      if let url = span.url.flatMap({ URL(string: $0) }) { part.link = url }
      if let background = WidgetHex.color(span.background) {
        part.backgroundColor = background
        part.foregroundColor = WidgetHex.color(span.color)
      }
      result.append(part)
    }
    return Text(result)
  }

  @ViewBuilder
  private func row(_ block: NoteBlock) -> some View {
    switch block.type {
    case "heading":
      inline(block.spans).font(.system(size: block.level == 1 ? 16 : 14, weight: .bold))
    case "listItem":
      HStack(alignment: .firstTextBaseline, spacing: 5) {
        Text(block.number.map { "\($0)." } ?? "•").font(.system(size: 13))
        inline(block.spans).font(.system(size: 13))
      }
      .padding(.leading, CGFloat(block.depth) * 12)
    case "todo":
      HStack(alignment: .firstTextBaseline, spacing: 5) {
        Image(systemName: block.checked ? "checkmark.square.fill" : "square")
          .font(.system(size: 12))
          .foregroundColor(block.checked ? WidgetTheme.accent : WidgetTheme.secondaryText)
        inline(block.spans)
          .font(.system(size: 13))
          .strikethrough(block.checked)
          .foregroundColor(block.checked ? WidgetTheme.secondaryText : .primary)
      }
      .padding(.leading, CGFloat(block.depth) * 12)
    case "quote":
      HStack(spacing: 6) {
        Rectangle().fill(WidgetTheme.accent).frame(width: 2)
        inline(block.spans).font(.system(size: 13)).italic().foregroundColor(WidgetTheme.secondaryText)
      }
      .fixedSize(horizontal: false, vertical: true)
    case "callout":
      let tint = WidgetHex.color(block.accent) ?? WidgetTheme.accent
      inline(block.spans)
        .font(.system(size: 13, weight: block.title ? .semibold : .regular))
        .foregroundColor(block.title ? tint : .primary)
        .padding(.horizontal, 7)
        .padding(.vertical, 4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tint.opacity(0.12))
        .cornerRadius(5)
    case "tableRow":
      HStack(alignment: .top, spacing: 0) {
        ForEach(Array(block.cells.enumerated()), id: \.offset) { index, cell in
          if index > 0 { Rectangle().fill(WidgetTheme.divider).frame(width: 1) }
          inline(cell)
            .font(.system(size: 12, weight: block.header ? .semibold : .regular))
            .lineLimit(2)
            .padding(.horizontal, 4)
            .padding(.vertical, 2)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
      }
      .background(block.header ? Color.primary.opacity(0.07) : Color.clear)
      .overlay(Rectangle().stroke(WidgetTheme.divider, lineWidth: 0.5))
      .fixedSize(horizontal: false, vertical: true)
    case "code":
      Text(block.text)
        .font(.system(size: 11, design: .monospaced))
        .padding(5)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.primary.opacity(0.07))
        .cornerRadius(4)
    case "rule":
      Divider().background(WidgetTheme.divider)
    default:
      inline(block.spans).font(.system(size: 13))
    }
  }
}
