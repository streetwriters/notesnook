import SwiftUI
import WidgetKit

struct WidgetEntry<Value>: TimelineEntry {
  let date: Date
  let value: Value
  let strings: WidgetStrings
}

protocol WidgetDataSource {
  associatedtype Value
  static var placeholder: Value { get }
  static func load() -> Value
  static func refreshDates(for value: Value, after now: Date) -> [Date]
}

extension WidgetDataSource {
  static func refreshDates(for value: Value, after now: Date) -> [Date] { [] }
}

protocol StoredListSource: WidgetDataSource where Value == [Item] {
  associatedtype Item: Decodable
  static var key: String { get }
}

extension StoredListSource {
  static func load() -> [Item] {
    WidgetStore.decode([Item].self, forKey: key) ?? []
  }
}

struct StoreProvider<Source: WidgetDataSource>: TimelineProvider {
  typealias Entry = WidgetEntry<Source.Value>

  static var maxEntries: Int { 12 }

  func placeholder(in context: Context) -> Entry {
    Entry(date: Date(), value: Source.placeholder, strings: WidgetStrings())
  }

  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
    if context.isPreview {
      completion(placeholder(in: context))
      return
    }
    completion(Entry(date: Date(), value: Source.load(), strings: WidgetStrings.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let now = Date()
    let value = Source.load()
    let strings = WidgetStrings.load()

    let upcoming = Source.refreshDates(for: value, after: now)
      .filter { $0 > now }
      .sorted()
    var dates = [now]
    for date in upcoming where date.timeIntervalSince(dates.last!) > 1 {
      dates.append(date)
    }
    dates = Array(dates.prefix(Self.maxEntries))

    let entries = dates.map { Entry(date: $0, value: value, strings: strings) }
    completion(Timeline(entries: entries, policy: dates.count > 1 ? .atEnd : .never))
  }
}
