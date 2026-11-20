package com.streetwriters.notesnook;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

public class NotesWidgetConfigureActivity extends NotePreviewConfigureActivity {
    @Override
    protected void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        NotesWidgetProvider.updateAppWidget(context, appWidgetManager, appWidgetId,
                new RemoteViews(context.getPackageName(), R.layout.widget_notes));
    }

    @Override
    protected String getMainComponentName() {
        return "NotesWidgetConfigure";
    }
}
