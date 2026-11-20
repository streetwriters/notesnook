import Foundation

struct Span: Decodable, Hashable {
  let text: String
  let bold: Bool
  let italic: Bool
  let strike: Bool
  let code: Bool
  let underline: Bool
  let url: String?
  let background: String?

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    func flag(_ key: CodingKeys) -> Bool {
      ((try? container.decodeIfPresent(Int.self, forKey: key)) ?? 0) != 0
    }
    text = try container.decodeIfPresent(String.self, forKey: .text) ?? ""
    bold = flag(.bold)
    italic = flag(.italic)
    strike = flag(.strike)
    code = flag(.code)
    underline = flag(.underline)
    url = try container.decodeIfPresent(String.self, forKey: .url)
    background = try container.decodeIfPresent(String.self, forKey: .background)
  }

  private enum CodingKeys: String, CodingKey {
    case text, bold, italic, strike, code, underline, url, background
  }
}

struct NoteBlock: Decodable, Hashable {
  let type: String
  let text: String
  let spans: [Span]
  let level: Int
  let depth: Int
  let number: Int?
  let checked: Bool
  let title: Bool
  let accent: String?
  let cells: [[Span]]
  let header: Bool

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    type = try container.decode(String.self, forKey: .type)
    text = try container.decodeIfPresent(String.self, forKey: .text) ?? ""
    spans = (try? container.decodeIfPresent([Span].self, forKey: .spans)) ?? []
    level = try container.decodeIfPresent(Int.self, forKey: .level) ?? 1
    depth = try container.decodeIfPresent(Int.self, forKey: .depth) ?? 0
    number = try container.decodeIfPresent(Int.self, forKey: .number)
    checked = try container.decodeIfPresent(Bool.self, forKey: .checked) ?? false
    title = try container.decodeIfPresent(Bool.self, forKey: .title) ?? false
    accent = try container.decodeIfPresent(String.self, forKey: .accent)
    cells = (try? container.decodeIfPresent([[Span]].self, forKey: .cells)) ?? []
    header = try container.decodeIfPresent(Bool.self, forKey: .header) ?? false
  }

  private enum CodingKeys: String, CodingKey {
    case type, text, spans, level, depth, number, checked, title, accent, cells, header
  }
}

struct WidgetNote: Decodable, Identifiable, Hashable {
  let id: String
  let title: String
  let headline: String
  let locked: Bool
  let blocks: [NoteBlock]

  init(id: String, title: String, headline: String = "", locked: Bool = false) {
    self.id = id
    self.title = title
    self.headline = headline
    self.locked = locked
    self.blocks = []
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    id = try container.decode(String.self, forKey: .id)
    title = try container.decodeIfPresent(String.self, forKey: .title) ?? ""
    headline = try container.decodeIfPresent(String.self, forKey: .headline) ?? ""
    locked = try container.decodeIfPresent(Bool.self, forKey: .locked) ?? false
    blocks = (try? container.decodeIfPresent([NoteBlock].self, forKey: .blocks)) ?? []
  }

  private enum CodingKeys: String, CodingKey {
    case id, title, headline, locked, blocks
  }
}

struct WidgetReminder: Codable, Identifiable, Hashable {
  enum Mode: String, Codable {
    case once, repeating = "repeat", permanent
  }

  static let recentlyPassedWindow: TimeInterval = 3 * 60 * 60

  let id: String
  let title: String
  let description: String
  let mode: Mode
  let triggerDate: Date
  let snoozeUntil: Date?
  let disabled: Bool

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    id = try container.decode(String.self, forKey: .id)
    title = try container.decodeIfPresent(String.self, forKey: .title) ?? ""
    description = try container.decodeIfPresent(String.self, forKey: .description) ?? ""
    mode = (try? container.decodeIfPresent(Mode.self, forKey: .mode)) ?? .once
    disabled = try container.decodeIfPresent(Bool.self, forKey: .disabled) ?? false

    let trigger = try container.decodeIfPresent(Double.self, forKey: .triggerDate) ?? 0
    triggerDate = Date(timeIntervalSince1970: trigger / 1000)

    let snooze = try container.decodeIfPresent(Double.self, forKey: .snoozeUntil) ?? 0
    snoozeUntil = snooze > 0 ? Date(timeIntervalSince1970: snooze / 1000) : nil
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(id, forKey: .id)
    try container.encode(title, forKey: .title)
    try container.encode(description, forKey: .description)
    try container.encode(mode, forKey: .mode)
    try container.encode(disabled, forKey: .disabled)
    try container.encode(triggerDate.timeIntervalSince1970 * 1000, forKey: .triggerDate)
    try container.encode((snoozeUntil?.timeIntervalSince1970 ?? 0) * 1000, forKey: .snoozeUntil)
  }

  private enum CodingKeys: String, CodingKey {
    case id, title, description, mode, triggerDate, snoozeUntil, disabled
  }

  func isSnoozed(at now: Date) -> Bool {
    guard let snoozeUntil = snoozeUntil else { return false }
    return snoozeUntil > now
  }

  func isVisible(at now: Date) -> Bool {
    if disabled { return false }
    if isSnoozed(at: now) { return true }
    if mode != .once { return true }
    return triggerDate > now.addingTimeInterval(-Self.recentlyPassedWindow)
  }

  func isUpcoming(at now: Date) -> Bool {
    triggerDate > now
  }

  var nextChange: [Date] {
    var dates = [triggerDate, triggerDate.addingTimeInterval(Self.recentlyPassedWindow)]
    if let snoozeUntil = snoozeUntil { dates.append(snoozeUntil) }
    return dates
  }
}
