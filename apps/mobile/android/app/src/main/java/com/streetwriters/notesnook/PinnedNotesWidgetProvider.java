package com.streetwriters.notesnook;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;




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
        WidgetUtils.updateNotesListWidget(context, appWidgetManager, appWidgetId, views,
                WidgetUtils.getWidgetPinnedNotes(context));
    }
}
