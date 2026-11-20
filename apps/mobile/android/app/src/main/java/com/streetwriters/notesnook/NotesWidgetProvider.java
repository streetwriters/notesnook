package com.streetwriters.notesnook;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import androidx.core.widget.RemoteViewsCompat;

import com.streetwriters.notesnook.datatypes.Note;
import com.streetwriters.notesnook.datatypes.NotesWidgetSource;

import java.util.List;

/**
 * Implementation of App Widget functionality for the configurable Notes widget.
 * Displays a scrollable collection of the notes of the source it was configured with.
 */
public class NotesWidgetProvider extends AppWidgetProvider {

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        super.onDeleted(context, appWidgetIds);
        SharedPreferences.Editor edit = context.getSharedPreferences(WidgetUtils.PREFERENCES, Context.MODE_PRIVATE).edit();
        for (int id : appWidgetIds) {
            edit.remove(WidgetUtils.NOTES_CONFIG_PREFIX + id);
        }
        edit.apply();
    }

    @Override
    public void onRestored(Context context, int[] oldWidgetIds, int[] newWidgetIds) {
        super.onRestored(context, oldWidgetIds, newWidgetIds);
        if (oldWidgetIds == null || newWidgetIds == null) return;

        int count = Math.min(oldWidgetIds.length, newWidgetIds.length);
        SharedPreferences preferences = context.getSharedPreferences(WidgetUtils.PREFERENCES, Context.MODE_PRIVATE);
        String[] configs = new String[count];
        for (int i = 0; i < count; i++) {
            configs[i] = preferences.getString(WidgetUtils.NOTES_CONFIG_PREFIX + oldWidgetIds[i], "");
        }

        SharedPreferences.Editor edit = preferences.edit();
        for (int i = 0; i < count; i++) {
            edit.remove(WidgetUtils.NOTES_CONFIG_PREFIX + oldWidgetIds[i]);
        }
        for (int i = 0; i < count; i++) {
            if (configs[i].isEmpty()) continue;
            edit.putString(WidgetUtils.NOTES_CONFIG_PREFIX + newWidgetIds[i], configs[i]);
        }
        edit.apply();
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_notes);
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


        // Build list items using RemoteCollectionItems: rows travel directly inside the widget update,
        // so no bound RemoteViewsService is required and updates are completely self-contained.
        NotesWidgetSource source = WidgetUtils.getNotesWidgetSource(context, appWidgetId);
        views.setTextViewText(R.id.widget_title, source.getTitle());
        List<Note> notes = WidgetUtils.getNotesWidgetNotes(context, source.getKey());
        RemoteViewsCompat.RemoteCollectionItems.Builder items =
                new RemoteViewsCompat.RemoteCollectionItems.Builder();
        for (Note note : notes) {
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
