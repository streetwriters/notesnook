package com.streetwriters.notesnook;

import android.app.ActivityOptions;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.widget.RemoteViewsService;
import android.content.Context;
import android.widget.RemoteViews;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.streetwriters.notesnook.datatypes.Reminder;

import java.util.ArrayList;
import java.util.List;

public class ReminderViewsService extends RemoteViewsService {
    static String OpenReminderId = "com.streetwriters.notesnook.OpenReminderId";
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new ReminderRemoteViewsFactory(this.getApplicationContext(), intent);
    }
}

class ReminderRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {
    private Context context;
    private List<Reminder> reminders;

    public ReminderRemoteViewsFactory(Context context, Intent intent) {
        this.context = context;
    }

    @Override
    public void onCreate() {
        // Initialize reminders list
        reminders = new ArrayList<Reminder>();
    }

    @Override
    public void onDataSetChanged() {
        reminders.clear();
        SharedPreferences preferences = context.getSharedPreferences("appPreview", Context.MODE_PRIVATE);
        Gson gson = new Gson();
        reminders = gson.fromJson(preferences.getString("remindersList","[]"), new TypeToken<List<Reminder>>(){}.getType());

    }

    @Override
    public void onDestroy() {
        reminders.clear();
    }

    @Override
    public int getCount() {
        return reminders.size();
    }

    @Override
    public RemoteViews getViewAt(int position) {
        Reminder reminder = reminders.get(position);

        boolean useMiniLayout = reminder.getDescription() == null || reminder.getDescription().isEmpty();

        RemoteViews views = new RemoteViews(context.getPackageName(), useMiniLayout ? R.layout.widget_reminder_layout_small :  R.layout.widget_reminder_layout);

        views.setTextViewText(R.id.reminder_title, reminder.getTitle());
        if (!useMiniLayout) {
               views.setTextViewText(R.id.reminder_description, reminder.getDescription());
        }
        views.setTextViewText(R.id.reminder_time, reminder.getFormattedTime());
        final Intent fillInIntent = new Intent();
        final Bundle extras = new Bundle();
        extras.putString(ReminderViewsService.OpenReminderId, reminder.getId());
        fillInIntent.setData(Uri.parse("https://notesnook.com/open_reminder?id=" + reminder.getId()));
        fillInIntent.putExtra(RCTNNativeModule.IntentType, "OpenReminder");
        fillInIntent.putExtras(extras);
        views.setOnClickFillInIntent(R.id.reminder_item_btn, fillInIntent);
        return views;
    }


    @Override
    public RemoteViews getLoadingView() {
        return null;
    }

    @Override
    public int getViewTypeCount() {
        return 2;
    }

    @Override
    public long getItemId(int position) {

        return position;
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }
}