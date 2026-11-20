import Foundation

enum WidgetLink {
  static let newNote = URL(string: "ShareMedia://QuickNoteWidget")!
  static let newReminder = URL(string: "nn://new_reminder")!

  static func note(_ id: String) -> URL {
    URL(string: "nn://note/\(encode(id))")!
  }

  static func reminder(_ id: String) -> URL {
    URL(string: "nn://open_reminder?id=\(encode(id))")!
  }

  static let pickNote = URL(string: "nn://pick_widget_note")!
  static func pickSource(slot: String) -> URL {
    URL(string: "nn://pick_widget_source?slot=\(encode(slot))")!
  }

  private static func encode(_ value: String) -> String {
    value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value
  }
}
