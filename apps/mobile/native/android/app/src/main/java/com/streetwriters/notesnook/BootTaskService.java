package com.streetwriters.notesnook;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

import javax.annotation.Nullable;

public class BootTaskService extends HeadlessJsTaskService {
    Notification notification;

    @Override
    protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        Log.d("BootTask", "Task Started");
        return new HeadlessJsTaskConfig(
                "com.streetwriters.notesnook.BOOT_TASK",
                Arguments.createMap(),
                30000, // timeout for the task
                false // optional: defines whether or not the task is allowed in foreground. Default is false
        );
    }

    @Override
    public void onHeadlessJsTaskFinish(int taskId) {
        super.onHeadlessJsTaskFinish(taskId);
        Log.d("BootTask", "Task completed");
        stopSelf();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel("com.streetwriters.notesnook",
                    "Default",
                    NotificationManager.IMPORTANCE_DEFAULT);

            ((NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE)).createNotificationChannel(channel);
            notification = new NotificationCompat.Builder(this, channel.getId())
                    .setContentTitle("Sync on boot")
                    .setContentText("")
                    .setSmallIcon(R.drawable.ic_stat_name)
                    .build();
            if (android.os.Build.VERSION.SDK_INT >= 34) {
                this.startForeground(
                        1,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } else {
                this.startForeground(
                        1,
                        notification);
            }

        }

        return super.onStartCommand(intent, flags, startId);
    }
}