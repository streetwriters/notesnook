package com.streetwriters.notesnook;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
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


    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId, RemoteViews views) {
        Intent listview_intent_template = new Intent(context, MainActivity.class);
        listview_intent_template.setAction(Intent.ACTION_VIEW);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, appWidgetId, listview_intent_template, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_MUTABLE, WidgetUtils.getActivityOptionsBundle());
        views.setPendingIntentTemplate(R.id.widget_list_view, pendingIntent);

        Intent new_reminder_intent = new Intent(context, MainActivity.class);
        new_reminder_intent.putExtra(NewReminder, NewReminder);
        new_reminder_intent.setAction(Intent.ACTION_VIEW);
        new_reminder_intent.putExtra(RCTNNativeModule.IntentType, "NewReminder");
        new_reminder_intent.setData(Uri.parse("https://app.notesnook.com/new_reminder"));
        PendingIntent pendingIntent2 = PendingIntent.getActivity(context, appWidgetId, new_reminder_intent, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE, WidgetUtils.getActivityOptionsBundle());
        views.setOnClickPendingIntent(R.id.add_button, pendingIntent2);

        Intent list_remote_adapter_intent = new Intent(context, ReminderViewsService.class);
        list_remote_adapter_intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        views.setRemoteAdapter(R.id.widget_list_view, list_remote_adapter_intent);
        views.setEmptyView(R.id.widget_list_view, R.id.empty_view);
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}