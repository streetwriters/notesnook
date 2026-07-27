package com.streetwriters.notesnook;

import android.app.ActivityOptions;
import android.os.Build;
import android.os.Bundle;

/**
 * Shared helpers for the home screen widgets.
 */
public class WidgetUtils {

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
}
