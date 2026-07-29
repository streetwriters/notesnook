package com.streetwriters.notesnook;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

import androidx.core.widget.RemoteViewsCompat;

import com.streetwriters.notesnook.datatypes.Reminder;

import java.util.List;

public class ReminderWidgetProvider extends AppWidgetProvider {
    static String NewReminder = "com.streetwriters.notesnook.NewReminder";
    static String OpenReminderId = "com.streetwriters.notesnook.OpenReminderId";

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

        // The rows travel with the update itself, so there is no bound service to keep in sync and
        // nothing to invalidate separately: every update redraws from the current data.
        List<Reminder> reminders = WidgetUtils.getWidgetReminders(context);
        RemoteViewsCompat.RemoteCollectionItems.Builder items =
                new RemoteViewsCompat.RemoteCollectionItems.Builder();
        for (Reminder reminder : reminders) {
            items.addItem(getItemId(reminder), WidgetUtils.createReminderItem(context, reminder));
        }
        // Two, because a reminder without a description uses the compact row layout.
        items.setViewTypeCount(2);
        items.setHasStableIds(true);

        RemoteViewsCompat.setRemoteAdapter(context, views, appWidgetId, R.id.widget_list_view, items.build());
        views.setEmptyView(R.id.widget_list_view, R.id.empty_view);
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /**
     * Ties a row to its reminder rather than to its position, so rows keep their identity when the
     * list shifts around them.
     */
    private static long getItemId(Reminder reminder) {
        return reminder.getId() == null ? 0 : reminder.getId().hashCode();
    }
}
