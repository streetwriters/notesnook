import Foundation

enum WidgetString: String, CaseIterable {
  case quickNote
  case addQuickNote
  case newNote
  case recentNotes
  case noNotes
  case reminders
  case noReminders
  case untitled
  case chooseNoteTitle
  case chooseNoteBody
  case lockedNote
  case ongoing
  case snoozedUntil
  case today
  case tomorrow
  case yesterday
  case upcoming
  case last
  case moreCount

  var fallback: String {
    switch self {
    case .quickNote: return "Quick note"
    case .addQuickNote: return "Add a quick note"
    case .newNote: return "New note"
    case .recentNotes: return "Recent"
    case .noNotes: return "No notes"
    case .reminders: return "Reminders"
    case .noReminders: return "Tap + to add a reminder"
    case .untitled: return "Untitled"
    case .chooseNoteTitle: return "Choose a note"
    case .chooseNoteBody: return "Tap to pick the note shown here."
    case .lockedNote: return "Locked note"
    case .ongoing: return "Ongoing"
    case .snoozedUntil: return "Snoozed until %@"
    case .today: return "Today, %@"
    case .tomorrow: return "Tomorrow, %@"
    case .yesterday: return "Yesterday, %@"
    case .upcoming: return "Upcoming: %@"
    case .last: return "Last: %@"
    case .moreCount: return "+%d more"
    }
  }
}

struct WidgetStrings {
  private let overrides: [String: String]

  init(overrides: [String: String] = [:]) {
    self.overrides = overrides
  }

  static func load() -> WidgetStrings {
    WidgetStrings(overrides: WidgetStore.decode([String: String].self, forKey: WidgetKey.strings) ?? [:])
  }

  subscript(string: WidgetString) -> String {
    if let value = overrides[string.rawValue], !value.isEmpty { return value }
    return string.fallback
  }

  func format(_ string: WidgetString, _ argument: String) -> String {
    String(format: self[string], argument)
  }

  func title(of note: WidgetNote) -> String {
    note.title.isEmpty ? self[.untitled] : note.title
  }
}
