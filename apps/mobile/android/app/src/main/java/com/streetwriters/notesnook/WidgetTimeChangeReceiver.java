package com.streetwriters.notesnook;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Redraws the widgets when the clock or timezone changes.
 *
 * Reminder rows are described relative to the current time ("Upcoming"/"Last", "Today"/"Tomorrow"),
 * and a reminder that has passed drops off the list entirely. All of that is decided when the
 * widget is drawn, so moving the clock leaves the previous drawing in place: a reminder can still
 * read "Upcoming" long after its time has gone by.
 *
 * The app normally redraws the list when a reminder notification is delivered, but that does not
 * happen if the reminder never fires, which is exactly the case when the clock jumps past it.
 *
 * Only TIME_SET and TIMEZONE_CHANGED are handled here: DATE_CHANGED is not exempt from the
 * Android 8 limits on manifest-registered implicit broadcasts, so a receiver for it would never
 * run. Crossing midnight is instead picked up by the widget's own periodic update.
 */
public class WidgetTimeChangeReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        WidgetUtils.refreshAll(context);
    }
}
