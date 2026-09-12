package com.streetwriters.notesnook;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import androidx.core.widget.RemoteViewsCompat;

import com.streetwriters.notesnook.datatypes.Note;

import java.util.List;

/**
 * Implementation of App Widget functionality for Pinned Notes.
 * Displays a scrollable collection of pinned notes on the home screen.
 */
public class PinnedNotesWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_pinned_notes);
            updateAppWidget(context, appWidgetManager, appWidgetId, views);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId, RemoteViews views) {
        // PendingIntent template for list items: tapping an individual note row fills in the note ID
        // and opens it directly in MainActivity / note editor.
        Intent listview_intent_template = new Intent(context, MainActivity.class);
        listview_intent_template.setAction(Intent.ACTION_VIEW);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, appWidgetId, listview_intent_template, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_MUTABLE, WidgetUtils.getActivityOptionsBundle());
        views.setPendingIntentTemplate(R.id.widget_list_view, pendingIntent);

        // Header '+' button opens the quick note composer (ShareActivity) without loading the full app.
        Intent new_note_intent = new Intent(context, ShareActivity.class);
        PendingIntent pendingIntent2 = PendingIntent.getActivity(context, appWidgetId, new_note_intent, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE, WidgetUtils.getActivityOptionsBundle());
        views.setOnClickPendingIntent(R.id.add_button, pendingIntent2);

        // Build list items using RemoteCollectionItems: rows travel directly inside the widget update,
        // so no bound RemoteViewsService is required and updates are completely self-contained.
        List<Note> pinnedNotes = WidgetUtils.getWidgetPinnedNotes(context);
        RemoteViewsCompat.RemoteCollectionItems.Builder items =
                new RemoteViewsCompat.RemoteCollectionItems.Builder();
        for (Note note : pinnedNotes) {
            items.addItem(getItemId(note), WidgetUtils.createPinnedNoteItem(context, note));
        }
        items.setViewTypeCount(1);
        items.setHasStableIds(true);

        RemoteViewsCompat.setRemoteAdapter(context, views, appWidgetId, R.id.widget_list_view, items.build());
        views.setEmptyView(R.id.widget_list_view, R.id.empty_view);
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /**
     * Stable ID for each note row so rows retain identity when list order shifts.
     */
    private static long getItemId(Note note) {
        return note.getId() == null ? 0 : note.getId().hashCode();
    }
}
