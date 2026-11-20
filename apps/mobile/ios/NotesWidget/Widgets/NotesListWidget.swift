import AppIntents
import SwiftUI
import WidgetKit

struct NotesListSource: Codable, Hashable, Identifiable {
  let key: String
  let title: String
  let type: String?
  var id: String { key }

  static let recent = NotesListSource(key: "recent", title: "Recent", type: "recent")
}

struct NotesListData {
  let source: NotesListSource
  let notes: [WidgetNote]
  let page: Int
  let slot: String
}

enum NotesListStore {
  static func sources() -> [NotesListSource] {
    let stored = WidgetStore.decode([NotesListSource].self, forKey: WidgetKey.widgetSources) ?? []
    return stored.isEmpty ? [.recent] : stored
  }

  static func load(sourceKey: String?, slot: String) -> NotesListData {
    let sources = sources()
    let slotSources = WidgetStore.decode([String: String].self, forKey: WidgetKey.widgetSlotSources) ?? [:]
    let source = sources.first { $0.key == slotSources[slot] }
      ?? sources.first { $0.key == sourceKey }
      ?? sources.first
      ?? .recent
    return NotesListData(
      source: source,
      notes: WidgetStore.decode([WidgetNote].self, forKey: WidgetKey.notes(forSource: source.key)) ?? [],
      page: WidgetStore.decode(Int.self, forKey: WidgetKey.notesPagePrefix + source.key) ?? 0,
      slot: slot
    )
  }

  static let placeholder = NotesListData(
    source: .recent,
    notes: [
      WidgetNote(id: "1", title: "Meeting notes", headline: "Discuss the roadmap and agree on timelines."),
      WidgetNote(id: "2", title: "Grocery list", headline: "Milk, sourdough bread, eggs, coffee beans"),
      WidgetNote(id: "3", title: "Book ideas", headline: "A short story about a lighthouse keeper")
    ],
    page: 0,
    slot: "placeholder"
  )
}

@available(iOS 17.0, *)
struct NotesPageIntent: AppIntent {
  static var title: LocalizedStringResource = "Change page"
  static var openAppWhenRun = false

  @Parameter(title: "Source")
  var sourceKey: String

  @Parameter(title: "Direction")
  var delta: Int

  init() {}

  init(sourceKey: String, delta: Int) {
    self.sourceKey = sourceKey
    self.delta = delta
  }

  func perform() async throws -> some IntentResult {
    let key = WidgetKey.notesPagePrefix + sourceKey
    let page = WidgetStore.decode(Int.self, forKey: key) ?? 0
    WidgetStore.encode(page + delta, forKey: key)
    WidgetCenter.shared.reloadTimelines(ofKind: WidgetKind.notesList)
    return .result()
  }
}

struct NotesListView: View {
  @Environment(\.widgetFamily) private var family
  let entry: WidgetEntry<NotesListData>

  private var data: NotesListData { entry.value }

  private var pageCount: Int {
    max(1, Int((Double(data.notes.count) / Double(family.listCapacity)).rounded(.up)))
  }

  private var pageIndex: Int {
    ((data.page % pageCount) + pageCount) % pageCount
  }

  private var pageNotes: [WidgetNote] {
    let capacity = family.listCapacity
    return Array(data.notes.dropFirst(pageIndex * capacity).prefix(capacity))
  }

  var body: some View {
    content.widgetBackground()
  }

  @ViewBuilder
  private var content: some View {
    if family == .systemSmall {
      small
    } else {
      VStack(alignment: .leading, spacing: 8) {
        WidgetHeader(
          title: data.source.title,
          actionIcon: "plus",
          actionURL: WidgetLink.newNote,
          titleURL: WidgetLink.pickSource(slot: data.slot)
        ) {
          pager
        }
        if data.notes.isEmpty {
          WidgetEmptyState(systemImage: "doc.text", text: entry.strings[.noNotes])
        } else {
          WidgetList(
            items: pageNotes,
            family: family,
            overflowText: { _ in "" }
          ) { note in
            WidgetRow(
              title: entry.strings.title(of: note),
              subtitle: note.locked ? entry.strings[.lockedNote] : note.headline,
              url: WidgetLink.note(note.id)
            )
          }
        }
      }
    }
  }

  @ViewBuilder
  private var pager: some View {
    if #available(iOS 17.0, *), pageCount > 1 {
      HStack(spacing: 6) {
        Button(intent: NotesPageIntent(sourceKey: data.source.key, delta: -1)) {
          Image(systemName: "chevron.up")
        }
        Text("\(pageIndex + 1)/\(pageCount)")
          .font(.system(size: 11))
          .foregroundColor(WidgetTheme.secondaryText)
        Button(intent: NotesPageIntent(sourceKey: data.source.key, delta: 1)) {
          Image(systemName: "chevron.down")
        }
      }
      .font(.system(size: 12, weight: .semibold))
      .foregroundColor(WidgetTheme.accent)
      .buttonStyle(.plain)
    }
  }

  @ViewBuilder
  private var small: some View {
    if let note = data.notes.first {
      WidgetCard(
        title: entry.strings.title(of: note),
        body_: note.locked ? entry.strings[.lockedNote] : note.headline,
        lineLimit: 4,
        locked: note.locked
      ) {
        Text(data.source.title)
          .font(.system(size: 11))
          .foregroundColor(WidgetTheme.accent)
          .lineLimit(1)
      }
      .widgetURL(WidgetLink.note(note.id))
    } else {
      WidgetEmptyState(systemImage: "doc.text", text: entry.strings[.noNotes])
        .widgetURL(WidgetLink.pickSource(slot: data.slot))
    }
  }
}

@available(iOS 17.0, *)
enum WidgetSlot: String, AppEnum {
  case automatic = "auto"
  case one = "1"
  case two = "2"
  case three = "3"
  case four = "4"
  case five = "5"

  static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Slot")
  static var caseDisplayRepresentations: [WidgetSlot: DisplayRepresentation] = [
    .automatic: "Automatic (by size)",
    .one: "Slot 1",
    .two: "Slot 2",
    .three: "Slot 3",
    .four: "Slot 4",
    .five: "Slot 5"
  ]
}

@available(iOS 17.0, *)
struct NotesSourceEntity: AppEntity {
  static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Source")
  static var defaultQuery = NotesSourceEntityQuery()

  let id: String
  let title: String
  let type: String?

  var displayRepresentation: DisplayRepresentation {
    guard let type, ["notebook", "tag", "color"].contains(type) else {
      return DisplayRepresentation(title: "\(title)")
    }
    return DisplayRepresentation(title: "\(title)", subtitle: "\(type.capitalized)")
  }

  init(_ source: NotesListSource) {
    id = source.key
    title = source.title
    type = source.type
  }
}

@available(iOS 17.0, *)
struct NotesSourceEntityQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [NotesSourceEntity] {
    NotesListStore.sources().filter { identifiers.contains($0.key) }.map(NotesSourceEntity.init)
  }

  func entities(matching string: String) async throws -> [NotesSourceEntity] {
    NotesListStore.sources()
      .filter { $0.title.localizedCaseInsensitiveContains(string) }
      .map(NotesSourceEntity.init)
  }

  func suggestedEntities() async throws -> [NotesSourceEntity] {
    NotesListStore.sources().map(NotesSourceEntity.init)
  }
}

@available(iOS 17.0, *)
struct NotesListIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Notes"
  static var description = IntentDescription(
    "Choose what to show, or tap the widget title to pick in the app. A source picked in the app takes priority for its slot. Give widgets of the same size different slots so they can show different things."
  )

  @Parameter(title: "Show")
  var source: NotesSourceEntity?

  @Parameter(title: "Slot", default: WidgetSlot.automatic)
  var slot: WidgetSlot
}

@available(iOS 17.0, *)
struct NotesListProvider: AppIntentTimelineProvider {
  typealias Entry = WidgetEntry<NotesListData>
  typealias Intent = NotesListIntent

  func placeholder(in context: Context) -> Entry {
    Entry(date: Date(), value: NotesListStore.placeholder, strings: WidgetStrings())
  }

  func snapshot(for configuration: Intent, in context: Context) async -> Entry {
    if context.isPreview { return placeholder(in: context) }
    return entry(for: configuration, family: context.family)
  }

  func timeline(for configuration: Intent, in context: Context) async -> Timeline<Entry> {
    Timeline(entries: [entry(for: configuration, family: context.family)], policy: .never)
  }

  private func slotKey(for configuration: Intent, family: WidgetFamily) -> String {
    if configuration.slot != .automatic { return "slot.\(configuration.slot.rawValue)" }
    switch family {
    case .systemSmall: return "size.small"
    case .systemMedium: return "size.medium"
    default: return "size.large"
    }
  }

  private func entry(for configuration: Intent, family: WidgetFamily) -> Entry {
    Entry(
      date: Date(),
      value: NotesListStore.load(sourceKey: configuration.source?.id, slot: slotKey(for: configuration, family: family)),
      strings: WidgetStrings.load()
    )
  }
}

@available(iOS 17.0, *)
struct NotesListWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: WidgetKind.notesList,
      intent: NotesListIntent.self,
      provider: NotesListProvider()
    ) { entry in
      NotesListView(entry: entry)
    }
    .configurationDisplayName("Notes")
    .description("Pinned, recent or favorite notes, or the notes of a notebook, tag or color.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}
