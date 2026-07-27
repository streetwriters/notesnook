package com.streetwriters.notesnook;

import android.app.ActivityOptions;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.format.DateUtils;
import android.util.Log;
import android.widget.RemoteViews;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.streetwriters.notesnook.datatypes.Reminder;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

/**
 * Shared helpers for the home screen widgets.
 */
public class WidgetUtils {

    static final String PREFERENCES = "appPreview";
    static final String REMINDERS_KEY = "remindersList";

    /**
     * Every row is serialized into the widget update itself, which has to fit inside a binder
     * transaction, so the list cannot grow without bound. Far more than fits on screen anyway.
     */
    private static final int MAX_REMINDERS = 50;

    /**
     * The reminders the app last wrote out, minus any that have since fired. Reading and filtering
     * happens here so the provider can push the rows straight into the widget.
     */
    static List<Reminder> getActiveReminders(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
        List<Reminder> stored = null;
        try {
            stored = new Gson().fromJson(preferences.getString(REMINDERS_KEY, "[]"),
                    new TypeToken<List<Reminder>>() {}.getType());
        } catch (Exception e) {
            Log.e("Reminders", "Could not read the stored reminders list", e);
        }

        List<Reminder> active = new ArrayList<>();
        if (stored == null) return active;

        for (Reminder reminder : stored) {
            if (!isReminderActive(reminder)) continue;
            if (active.size() >= MAX_REMINDERS) {
                Log.w("Reminders", "Widget list truncated to " + MAX_REMINDERS + " reminders");
                break;
            }
            active.add(reminder);
        }
        return active;
    }

    /**
     * Builds a single row of the reminders list.
     */
    static RemoteViews createReminderItem(Context context, Reminder reminder) {
        boolean useMiniLayout = reminder.getDescription() == null || reminder.getDescription().isEmpty();

        RemoteViews views = new RemoteViews(context.getPackageName(),
                useMiniLayout ? R.layout.widget_reminder_layout_small : R.layout.widget_reminder_layout);

        views.setTextViewText(R.id.reminder_title, reminder.getTitle());
        if (!useMiniLayout) {
            views.setTextViewText(R.id.reminder_description, reminder.getDescription());
        }
        views.setTextViewText(R.id.reminder_time, formatReminderTime(context, reminder));

        Intent fillInIntent = new Intent();
        fillInIntent.setData(Uri.parse("https://app.notesnook.com/open_reminder?id=" + reminder.getId()));
        fillInIntent.putExtra(RCTNNativeModule.IntentType, "OpenReminder");
        fillInIntent.putExtra(ReminderWidgetProvider.OpenReminderId, reminder.getId());
        views.setOnClickFillInIntent(R.id.reminder_item_btn, fillInIntent);
        return views;
    }

    /**
     * Options attached to the PendingIntents our widgets hand to the launcher, opting the creator
     * (us) in to background activity starts so a tap on the widget can bring up an activity.
     *
     * MODE_BACKGROUND_ACTIVITY_START_ALLOWED is deprecated since API 36 and Android 17 extends the
     * background activity launch restrictions to IntentSender, so on API 36+ we use the narrower
     * MODE_BACKGROUND_ACTIVITY_START_ALLOW_IF_VISIBLE instead. That is enough for widgets: the
     * sender is the launcher, which is visible whenever the user taps the widget.
     */
    static Bundle getActivityOptionsBundle() {
        ActivityOptions activityOptions;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.BAKLAVA) {
            activityOptions = ActivityOptions.makeBasic();
            activityOptions.setPendingIntentCreatorBackgroundActivityStartMode(
                    ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOW_IF_VISIBLE);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            activityOptions = ActivityOptions.makeBasic();
            activityOptions.setPendingIntentCreatorBackgroundActivityStartMode(
                    ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED);
        } else {
            return null;
        }
        return activityOptions.toBundle();
    }

    /**
     * Whether a reminder should still be listed. Mirrors isReminderActive() in the core package,
     * which the app applies when it writes the list out. We re-check here because the stored list
     * is only rewritten while the app runs, so one-off reminders would otherwise linger in the
     * widget long after they fired.
     */
    static boolean isReminderActive(Reminder reminder) {
        if (reminder == null) return false;
        if (reminder.isDisabled()) return false;

        long now = System.currentTimeMillis();
        if (reminder.getSnoozeUntil() > now) return true;
        if (!"once".equals(reminder.getMode())) return true;

        long triggerDate = reminder.getTriggerDate() > 0 ? reminder.getTriggerDate() : reminder.getDate();
        return triggerDate > now;
    }

    /**
     * Builds the label shown under a reminder. The app sends us the absolute trigger time plus the
     * parts that never change ("5:00 PM", "12-05-2026, 5:00 PM"); everything that depends on the
     * current time is decided here so it stays right as the widget redraws.
     *
     * Falls back to the pre-formatted string for lists written by an older version of the app.
     */
    static String formatReminderTime(Context context, Reminder reminder) {
        long triggerDate = reminder.getTriggerDate();
        String timeOfDay = reminder.getFormattedTimeOfDay();
        if (triggerDate <= 0 || timeOfDay == null || timeOfDay.isEmpty()) {
            return reminder.getFormattedTime();
        }

        if ("permanent".equals(reminder.getMode())) {
            return context.getString(R.string.reminder_ongoing);
        }

        long now = System.currentTimeMillis();
        if (reminder.getSnoozeUntil() > now) {
            return context.getString(R.string.reminder_snoozed_until, timeOfDay);
        }

        String text;
        long dayOffset = daysFromToday(triggerDate, now);
        if (dayOffset == 0) {
            text = context.getString(R.string.reminder_today, timeOfDay);
        } else if (dayOffset == 1) {
            text = context.getString(R.string.reminder_tomorrow, timeOfDay);
        } else if (dayOffset == -1) {
            text = context.getString(R.string.reminder_yesterday, timeOfDay);
        } else {
            text = reminder.getFormattedDateTime();
            if (text == null || text.isEmpty()) return reminder.getFormattedTime();
        }

        return context.getString(
                triggerDate <= now ? R.string.reminder_last : R.string.reminder_upcoming, text);
    }

    /**
     * Calendar days between two instants. Compares midnights rather than subtracting the raw
     * difference so that "tomorrow" is still tomorrow across a DST change or just before midnight.
     */
    private static long daysFromToday(long time, long now) {
        long target = startOfDay(time);
        long today = startOfDay(now);
        return Math.round((target - today) / (double) DateUtils.DAY_IN_MILLIS);
    }

    private static long startOfDay(long time) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(time);
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }
}
