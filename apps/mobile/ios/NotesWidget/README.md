# iOS widgets

The app writes JSON into a dedicated MMKV instance (`widgets`) that lives in the shared app group container. The widget extension reads from the same instance and the app asks WidgetKit to reload through the `NNWidgets` native module.

## Layout

- `ios/WidgetShared/WidgetKeys.swift` - storage keys and widget kinds, compiled into both the app and the extension
- `Core/WidgetStore.swift` - reads and writes the shared MMKV instance
- `Core/WidgetDataSource.swift` - `WidgetDataSource`, `StoredListSource` and the generic `StoreProvider` timeline provider
- `Core/WidgetComponents.swift`, `Core/WidgetTheme.swift` - shared SwiftUI building blocks
- `Core/WidgetStrings.swift` - strings with English fallbacks, overridden by the localized strings the app publishes
- `Core/WidgetDeepLink.swift` - URLs handled in `app/hooks/use-app-events.tsx`
- `Widgets/` - one file per widget

## Adding a widget

1. Add a key to `WidgetKey` and a kind to `WidgetKind` (and to `WidgetKind.all`).
2. In `Widgets/`, add a `StoredListSource` (or `WidgetDataSource`) for the data, a SwiftUI view that takes a `WidgetEntry<Value>`, and a `Widget` using `StoreProvider<YourSource>()`.
3. Register it in `NotesWidgetBundle` in `NotesWidget.swift`, and add the new file to the `NotesWidgetExtension` target.
4. In the app, build the payload and call `IOSWidgets.publish(key, payload, [kind])` from `app/services/widgets/ios-widgets.ts`.
5. Return `refreshDates` from the source if the content changes with time without the app running.

Configurable widgets (see `NotePreviewWidget.swift`) need iOS 17 and use `AppIntentConfiguration`.
