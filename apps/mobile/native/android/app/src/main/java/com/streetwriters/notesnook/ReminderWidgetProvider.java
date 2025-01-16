package com.streetwriters.notesnook;

import android.app.ActivityOptions;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.widget.RemoteViews;

public class ReminderWidgetProvider extends AppWidgetProvider {
    static String NewReminder = "com.streetwriters.notesnook.NewReminder";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_reminders);
            updateAppWidget(context, appWidgetManager, appWidgetId, views);
        }
    }


    private static Bundle getActivityOptionsBundle() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            ActivityOptions activityOptions = ActivityOptions.makeBasic();
            activityOptions.setPendingIntentBackgroundActivityStartMode(ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED);
            return activityOptions.toBundle();
        } else
            return null;
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId, RemoteViews views) {
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE, getActivityOptionsBundle());
        views.setPendingIntentTemplate(R.id.widget_list_view, pendingIntent);

        Intent intent2 = new Intent(context, MainActivity.class);
        intent2.putExtra(NewReminder, NewReminder);
        PendingIntent pendingIntent2 = PendingIntent.getActivity(context, 0, intent2, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE, getActivityOptionsBundle());
        views.setOnClickPendingIntent(R.id.add_button, pendingIntent2);

        Intent intent3 = new Intent(context, ReminderViewsService.class);
        intent3.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        views.setRemoteAdapter(R.id.widget_list_view, intent3);
        views.setEmptyView(R.id.widget_list_view, R.id.empty_view);
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}