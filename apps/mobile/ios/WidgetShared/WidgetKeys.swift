import Foundation

enum WidgetKey {
  static let widgetSources = "widgetSources"
  static let widgetSlotSources = "widgetSlotSources"
  static let notesPagePrefix = "notesPage."
  static let previewNotes = "previewNotes"
  static let reminders = "reminders"
  static let strings = "strings"
  static let theme = "theme"

  static func notes(forSource key: String) -> String {
    "notes.\(key)"
  }
}

enum WidgetKind {
  static let quickNote = "NotesWidget"
  static let notesList = "NotesListWidget"
  static let reminders = "RemindersWidget"
  static let notePreview = "NotePreviewWidget"

  static let all = [quickNote, notesList, reminders, notePreview]
}
