package com.streetwriters.notesnook;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;


import com.streetwriters.notesnook.datatypes.NotesWidgetSource;


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
        WidgetUtils.removeUnusedNotesLists(context);
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
        NotesWidgetSource source = WidgetUtils.getNotesWidgetSource(context, appWidgetId);
        views.setTextViewText(R.id.widget_title, WidgetUtils.getNotesWidgetTitle(context, source));
        WidgetUtils.updateNotesListWidget(context, appWidgetManager, appWidgetId, views,
                WidgetUtils.getNotesWidgetNotes(context, source.getKey()));
    }
}
