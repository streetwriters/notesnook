package com.streetwriters.notesnook;

import android.app.ActivityOptions;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
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
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.note_widget);
        views.setTextViewText(R.id.widget_title, note.getTitle());
        views.setTextViewText(R.id.widget_body, note.getHeadline());

        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra(OpenNoteId, note.getId());
        intent.setAction(Intent.ACTION_VIEW);
        intent.putExtra(RCTNNativeModule.IntentType, "OpenNote");
        intent.setData(Uri.parse("https://notesnook.com/open_note?id=" + note.getId()));
        PendingIntent pendingIntent = PendingIntent.getActivity(context, appWidgetId, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE, getActivityOptionsBundle());
        views.setOnClickPendingIntent(R.id.open_note, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
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