package com.streetwriters.notesnook;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import android.app.ActivityManager;
import com.facebook.react.HeadlessJsTaskService;

import java.util.List;

public class BootRecieverService extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
          if (!isAppOnForeground((context))) {
            /**
             We will start our service and send extra info about
             network connections
             **/
            Intent serviceIntent = new Intent(context, BootTaskService.class);
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                  context.startForegroundService(serviceIntent);
              } else {
                  context.startService(serviceIntent);
              }
              HeadlessJsTaskService.acquireWakeLockNow(context);
        }
    }

    private boolean isAppOnForeground(Context context) {
        /**
         We need to check if app is in foreground otherwise the app will crash.
         http://stackoverflow.com/questions/8489993/check-android-application-is-in-foreground-or-not
         **/
        ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        List<ActivityManager.RunningAppProcessInfo> appProcesses =
                activityManager.getRunningAppProcesses();
        if (appProcesses == null) {
            return false;
        }
        final String packageName = context.getPackageName();
        for (ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
            if (appProcess.importance ==
                    ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND &&
                    appProcess.processName.equals(packageName)) {
                return true;
            }
        }
        return false;
    }
}