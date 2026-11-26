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

  static func newNote(type: String, id: String) -> URL {
    sourceURL("new_note", type: type, id: id)
  }

  static func openSource(type: String, id: String) -> URL {
    sourceURL("open_source", type: type, id: id)
  }

  static let pickNote = URL(string: "nn://pick_widget_note")!
  static func pickSource(slot: String) -> URL {
    URL(string: "nn://pick_widget_source?slot=\(encode(slot))")!
  }

  private static func sourceURL(_ host: String, type: String, id: String) -> URL {
    var components = URLComponents()
    components.scheme = "nn"
    components.host = host
    components.queryItems = [URLQueryItem(name: "type", value: type), URLQueryItem(name: "id", value: id)]
    return components.url!
  }

  private static func encode(_ value: String) -> String {
    value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value
  }
}
