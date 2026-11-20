import AppIntents
import SwiftUI
import WidgetKit

enum NotePreviewState {
  case unconfigured
  case note(WidgetNote)
}

enum NotePreviewStore {
  static func notes() -> [WidgetNote] {
    WidgetStore.decode([WidgetNote].self, forKey: WidgetKey.previewNotes) ?? []
  }
}

@available(iOS 17.0, *)
struct NoteEntity: AppEntity {
  static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Note")
  static var defaultQuery = NoteEntityQuery()

  let id: String
  let title: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(title.isEmpty ? "Untitled" : title)")
  }

  init(_ note: WidgetNote) {
    id = note.id
    title = note.title
  }
}

@available(iOS 17.0, *)
struct NoteEntityQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [NoteEntity] {
    NotePreviewStore.notes().filter { identifiers.contains($0.id) }.map(NoteEntity.init)
  }

  func entities(matching string: String) async throws -> [NoteEntity] {
    NotePreviewStore.notes()
      .filter { $0.title.localizedCaseInsensitiveContains(string) }
      .map(NoteEntity.init)
  }

  func suggestedEntities() async throws -> [NoteEntity] {
    NotePreviewStore.notes().map(NoteEntity.init)
  }
}

@available(iOS 17.0, *)
struct NotePreviewIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Note"
  static var description = IntentDescription(
    "Choose from the notes you added to widgets in the app. Without a choice, the latest added note is shown."
  )

  @Parameter(title: "Note")
  var note: NoteEntity?
}

@available(iOS 17.0, *)
struct NotePreviewProvider: AppIntentTimelineProvider {
  typealias Entry = WidgetEntry<NotePreviewState>
  typealias Intent = NotePreviewIntent

  func placeholder(in context: Context) -> Entry {
    Entry(
      date: Date(),
      value: .note(
        WidgetNote(id: "1", title: "Meeting notes", headline: "Discuss the roadmap and agree on timelines.")
      ),
      strings: WidgetStrings()
    )
  }

  func snapshot(for configuration: Intent, in context: Context) async -> Entry {
    if context.isPreview { return placeholder(in: context) }
    return entry(for: configuration)
  }

  func timeline(for configuration: Intent, in context: Context) async -> Timeline<Entry> {
    Timeline(entries: [entry(for: configuration)], policy: .never)
  }

  private func entry(for configuration: Intent) -> Entry {
    let notes = NotePreviewStore.notes()
    let note: WidgetNote?
    if let selected = configuration.note {
      note = notes.first { $0.id == selected.id }
    } else {
      note = notes.first
    }
    return Entry(
      date: Date(),
      value: note.map { .note($0) } ?? .unconfigured,
      strings: WidgetStrings.load()
    )
  }
}

@available(iOS 17.0, *)
struct NotePreviewView: View {
  @Environment(\.widgetFamily) private var family
  let entry: WidgetEntry<NotePreviewState>

  @ViewBuilder
  private func noteCard(_ note: WidgetNote) -> some View {
    if note.locked || note.blocks.isEmpty {
      WidgetCard(
        title: entry.strings.title(of: note),
        body_: note.locked ? entry.strings[.lockedNote] : note.headline,
        lineLimit: family.previewLineLimit,
        locked: note.locked
      )
    } else {
      VStack(alignment: .leading, spacing: 6) {
        Text(entry.strings.title(of: note))
          .font(.system(size: 15, weight: .semibold))
          .lineLimit(2)
        WidgetBlocksView(blocks: note.blocks)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
  }

  var body: some View {
    content.widgetBackground()
  }

  @ViewBuilder
  private var content: some View {
    switch entry.value {
    case .note(let note):
      noteCard(note)
      .overlay(alignment: .topTrailing) {
        if family != .systemSmall {
          Link(destination: WidgetLink.pickNote) {
            Image(systemName: "plus.circle")
              .font(.system(size: 16))
              .foregroundColor(WidgetTheme.secondaryText)
          }
        }
      }
      .widgetURL(WidgetLink.note(note.id))
    case .unconfigured:
      WidgetEmptyState(systemImage: "doc.text", text: entry.strings[.chooseNoteBody])
        .widgetURL(WidgetLink.pickNote)
    }
  }
}

@available(iOS 17.0, *)
struct NotePreviewWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: WidgetKind.notePreview,
      intent: NotePreviewIntent.self,
      provider: NotePreviewProvider()
    ) { entry in
      NotePreviewView(entry: entry)
    }
    .configurationDisplayName("Note Preview")
    .description("Show a note on your home screen.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}
