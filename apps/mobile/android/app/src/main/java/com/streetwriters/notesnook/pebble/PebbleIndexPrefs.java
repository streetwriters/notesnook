package com.streetwriters.notesnook.pebble;

import android.content.Context;
import android.content.SharedPreferences;

public final class PebbleIndexPrefs {
    private PebbleIndexPrefs() {}

    static SharedPreferences prefs(Context context) {
        return context.getApplicationContext()
                .getSharedPreferences(PebbleIndexContract.PREFS, Context.MODE_PRIVATE);
    }

    public static boolean captureEnabled(Context context) {
        return prefs(context).getBoolean(PebbleIndexContract.PREF_CAPTURE_ENABLED, true);
    }

    public static void setCaptureEnabled(Context context, boolean enabled) {
        prefs(context).edit()
                .putBoolean(PebbleIndexContract.PREF_CAPTURE_ENABLED, enabled)
                .apply();
    }

    public static boolean keepAlive(Context context) {
        return prefs(context).getBoolean(PebbleIndexContract.PREF_KEEP_ALIVE, false);
    }

    public static void setKeepAlive(Context context, boolean enabled) {
        prefs(context).edit()
                .putBoolean(PebbleIndexContract.PREF_KEEP_ALIVE, enabled)
                .apply();
    }

    public static String reminderPriority(Context context) {
        String value = prefs(context).getString(PebbleIndexContract.PREF_REMINDER_PRIORITY, "urgent");
        if ("silent".equals(value) || "vibrate".equals(value) || "urgent".equals(value)) {
            return value;
        }
        return "urgent";
    }

    public static void setReminderPriority(Context context, String priority) {
        if (priority == null) priority = "urgent";
        prefs(context).edit()
                .putString(PebbleIndexContract.PREF_REMINDER_PRIORITY, priority)
                .apply();
    }
}
