import SwiftUI
import WidgetKit

@main
struct NotesWidgetBundle: WidgetBundle {
  @WidgetBundleBuilder
  var body: some Widget {
    QuickNoteWidget()
    RemindersWidget()
    if #available(iOS 17.0, *) {
      NotesListWidget()
      NotePreviewWidget()
    }
  }
}
