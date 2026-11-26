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

  static func newNote(type: String, id: String) -> URL? {
    sourceURL(type: type, id: id, newNote: true)
  }

  static func openSource(type: String, id: String) -> URL? {
    sourceURL(type: type, id: id, newNote: false)
  }

  static let pickNote = URL(string: "nn://pick_widget_note")!
  static func pickSource(slot: String) -> URL {
    URL(string: "nn://pick_widget_source?slot=\(encode(slot))")!
  }

  private static func sourceURL(type: String, id: String, newNote: Bool) -> URL? {
    var components = URLComponents()
    components.scheme = "https"
    components.host = "app.notesnook.com"
    components.path = "/open_\(type)"
    components.queryItems = [URLQueryItem(name: "id", value: id)] + (newNote ? [URLQueryItem(name: "new", value: "1")] : [])
    return components.url
  }

  private static func encode(_ value: String) -> String {
    value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value
  }
}
