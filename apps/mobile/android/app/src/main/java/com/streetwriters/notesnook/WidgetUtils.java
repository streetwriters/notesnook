package com.streetwriters.notesnook;

import android.app.ActivityOptions;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
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
import com.streetwriters.notesnook.datatypes.Note;
import com.streetwriters.notesnook.datatypes.Reminder;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

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
     * Redraws every widget that currently exists, and drops stored notes for widgets that no
     * longer do.
     *
     * Everything else keys off what we have stored, which is fine while the app is running but
     * leaves widgets showing content that no longer exists once the store is emptied underneath
     * them (clearing app data) or a widget is removed while the app is stopped (onDeleted never
     * arrives). Starting from the widgets the system knows about, rather than from our own data,
     * is what makes this self-correcting.
     *
     * NoteWidget is left alone deliberately: it is a static button with no stored state, and its
     * layout depends on the size it was last given.
     */
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        int[] noteWidgetIds = manager.getAppWidgetIds(
                new ComponentName(context, NotePreviewWidget.class));
        removeOrphanedNotes(context, noteWidgetIds);
        for (int appWidgetId : noteWidgetIds) {
            NotePreviewWidget.updateAppWidget(context, manager, appWidgetId);
        }

        for (int appWidgetId : manager.getAppWidgetIds(
                new ComponentName(context, ReminderWidgetProvider.class))) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_reminders);
            ReminderWidgetProvider.updateAppWidget(context, manager, appWidgetId, views);
        }
    }

    /**
     * Drops stored notes whose widget is gone, so the preferences file cannot grow forever.
     */
    private static void removeOrphanedNotes(Context context, int[] liveWidgetIds) {
        Set<String> live = new HashSet<>();
        for (int appWidgetId : liveWidgetIds) live.add(String.valueOf(appWidgetId));

        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
        SharedPreferences.Editor edit = preferences.edit();
        boolean changed = false;

        for (String key : preferences.getAll().keySet()) {
            // Leave anything that is not a widget id alone, the reminders list included.
            if (parseWidgetId(key) == null || live.contains(key)) continue;
            edit.remove(key);
            changed = true;
        }
        if (changed) edit.apply();
    }

    /**
     * The note each note widget is showing, keyed by widget id.
     *
     * The preferences file mixes two things: one note per widget id, and the reminders list under
     * its own key. Only numeric keys are widget notes, so anything else is skipped rather than
     * being treated as a note.
     */
    static Map<Integer, Note> getWidgetNotes(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
        Map<Integer, Note> notes = new LinkedHashMap<>();

        for (Map.Entry<String, ?> entry : preferences.getAll().entrySet()) {
            Integer widgetId = parseWidgetId(entry.getKey());
            if (widgetId == null) continue;
            if (!(entry.getValue() instanceof String)) continue;

            Note note = parseNote((String) entry.getValue());
            if (note == null || note.getId() == null) continue;
            notes.put(widgetId, note);
        }
        return notes;
    }

    /**
     * The widget id a preferences key refers to, or null if the key is not a widget id at all.
     */
    private static Integer parseWidgetId(String key) {
        try {
            return Integer.valueOf(key);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    static Note parseNote(String data) {
        if (data == null || data.isEmpty()) return null;
        try {
            return new Gson().fromJson(data, Note.class);
        } catch (Exception e) {
            Log.e("NotePreviewWidget", "Could not read a stored note", e);
            return null;
        }
    }

    /**
     * The reminders the app last wrote out, minus any that have now dropped out of view. Reading
     * and filtering happens here so the provider can push the rows straight into the widget.
     */
    static List<Reminder> getWidgetReminders(Context context) {
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
            if (!isVisibleInWidget(reminder)) continue;
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
     * How long a reminder keeps its place in the list after going off, so the user can see that it
     * happened rather than watching it vanish. Must match RECENTLY_PASSED_WINDOW in
     * services/notifications.ts, which decides what gets written out in the first place.
     */
    private static final long RECENTLY_PASSED_WINDOW_MS = TimeUnit.HOURS.toMillis(3);

    /**
     * Whether a reminder should still be drawn.
     *
     * We re-check here rather than trusting the stored list because that list is only rewritten
     * while the app runs. This is what actually retires a reminder once its grace period is up:
     * every redraw re-evaluates it against the current time.
     */
    static boolean isVisibleInWidget(Reminder reminder) {
        if (reminder == null) return false;
        if (reminder.isDisabled()) return false;

        long now = System.currentTimeMillis();
        if (reminder.getSnoozeUntil() > now) return true;
        if (!"once".equals(reminder.getMode())) return true;

        long triggerDate = reminder.getTriggerDate() > 0 ? reminder.getTriggerDate() : reminder.getDate();
        return triggerDate > now - RECENTLY_PASSED_WINDOW_MS;
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
