package com.streetwriters.notesnook;

import android.app.ActivityOptions;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.widget.RemoteViews;
import com.google.gson.Gson;
import com.streetwriters.notesnook.datatypes.Note;


public class NotePreviewWidget extends AppWidgetProvider {
    static String OpenNoteId = "com.streetwriters.notesnook.OpenNoteId";
    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager,
                                int appWidgetId) {
        String data = context.getSharedPreferences("appPreview", Context.MODE_PRIVATE).getString(String.valueOf(appWidgetId), "");
        if (data.isEmpty()) {
            return;
        }
        Gson gson = new Gson();
        Note note = gson.fromJson(data, Note.class);
        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra(OpenNoteId, note.getId());
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE, getActivityOptionsBundle());
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.note_widget);
        views.setTextViewText(R.id.widget_title, note.getTitle());
        views.setTextViewText(R.id.widget_body, note.getHeadline());
        views.setOnClickPendingIntent(R.id.widget_button, pendingIntent);
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static Bundle getActivityOptionsBundle() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            ActivityOptions activityOptions = ActivityOptions.makeBasic();
            activityOptions.setPendingIntentBackgroundActivityStartMode(ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED);
            return activityOptions.toBundle();
        } else
            return null;
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        super.onDeleted(context, appWidgetIds);
        SharedPreferences.Editor edit = context.getSharedPreferences("appPreview", Context.MODE_PRIVATE).edit();
        for (int id: appWidgetIds) {
            edit.remove(String.valueOf(id));
        }
        edit.apply();
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // There may be multiple widgets active, so update all of them
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
}