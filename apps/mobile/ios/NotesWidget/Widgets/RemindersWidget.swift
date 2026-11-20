import SwiftUI
import WidgetKit

struct RemindersSource: StoredListSource {
  typealias Item = WidgetReminder
  static let key = WidgetKey.reminders
  static var placeholder: [WidgetReminder] { [] }

  static func refreshDates(for value: [WidgetReminder], after now: Date) -> [Date] {
    var dates = value.flatMap { $0.nextChange }
    if let midnight = Calendar.current.nextDate(
      after: now,
      matching: DateComponents(hour: 0, minute: 0),
      matchingPolicy: .nextTime
    ) {
      dates.append(midnight)
    }
    return dates
  }
}

enum ReminderTimeLabel {
  static func text(for reminder: WidgetReminder, at now: Date, strings: WidgetStrings) -> String {
    if reminder.mode == .permanent { return strings[.ongoing] }

    let time = format(reminder.triggerDate, date: .none, time: .short)
    if reminder.isSnoozed(at: now), let until = reminder.snoozeUntil {
      return strings.format(.snoozedUntil, format(until, date: .none, time: .short))
    }

    let calendar = Calendar.current
    let days = calendar.dateComponents(
      [.day],
      from: calendar.startOfDay(for: now),
      to: calendar.startOfDay(for: reminder.triggerDate)
    ).day ?? 0

    let when: String
    switch days {
    case 0: when = strings.format(.today, time)
    case 1: when = strings.format(.tomorrow, time)
    case -1: when = strings.format(.yesterday, time)
    default: when = format(reminder.triggerDate, date: .short, time: .short)
    }
    return strings.format(reminder.isUpcoming(at: now) ? .upcoming : .last, when)
  }

  private static func format(_ date: Date, date dateStyle: DateFormatter.Style, time: DateFormatter.Style) -> String {
    let formatter = DateFormatter()
    formatter.dateStyle = dateStyle
    formatter.timeStyle = time
    return formatter.string(from: date)
  }
}

struct RemindersView: View {
  @Environment(\.widgetFamily) private var family
  let entry: WidgetEntry<[WidgetReminder]>

  private var reminders: [WidgetReminder] {
    entry.value.filter { $0.isVisible(at: entry.date) }
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
          title: entry.strings[.reminders],
          actionIcon: "plus",
          actionURL: WidgetLink.newReminder
        )
        if reminders.isEmpty {
          WidgetEmptyState(systemImage: "bell", text: entry.strings[.noReminders])
        } else {
          WidgetList(
            items: reminders,
            family: family,
            overflowText: { String(format: entry.strings[.moreCount], $0) }
          ) { reminder in
            row(reminder)
          }
        }
      }
    }
  }

  private func row(_ reminder: WidgetReminder) -> some View {
    WidgetRow(
      title: reminder.title.isEmpty ? entry.strings[.untitled] : reminder.title,
      subtitle: ReminderTimeLabel.text(for: reminder, at: entry.date, strings: entry.strings),
      url: WidgetLink.reminder(reminder.id)
    )
  }

  @ViewBuilder
  private var small: some View {
    if let reminder = reminders.first {
      WidgetCard(
        title: reminder.title.isEmpty ? entry.strings[.untitled] : reminder.title,
        body_: reminder.description,
        lineLimit: 3
      ) {
        Text(ReminderTimeLabel.text(for: reminder, at: entry.date, strings: entry.strings))
          .font(.system(size: 11))
          .foregroundColor(WidgetTheme.accent)
          .lineLimit(2)
      }
      .widgetURL(WidgetLink.reminder(reminder.id))
    } else {
      WidgetEmptyState(systemImage: "bell", text: entry.strings[.noReminders])
        .widgetURL(WidgetLink.newReminder)
    }
  }
}

struct RemindersWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: WidgetKind.reminders, provider: StoreProvider<RemindersSource>()) { entry in
      RemindersView(entry: entry)
    }
    .configurationDisplayName("Reminders")
    .description("Your upcoming reminders at a glance.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}
