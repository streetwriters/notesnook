package com.streetwriters.notesnook.pebble;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.streetwriters.notesnook.MainActivity;
import com.streetwriters.notesnook.R;

/**
 * Optional sticky foreground service so Notesnook stays process-warm and can
 * accept Index captures without the user opening the app. Toggled from
 * Settings → Pebble Index 01 → Keep ready in background.
 */
public class PebbleIndexKeepAliveService extends Service {
    private static final String TAG = "PebbleIndexKeepAlive";

    public static void start(Context context) {
        Intent intent = new Intent(context, PebbleIndexKeepAliveService.class);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start keep-alive", e);
        }
    }

    public static void stop(Context context) {
        context.stopService(new Intent(context, PebbleIndexKeepAliveService.class));
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!PebbleIndexPrefs.keepAlive(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        promoteToForeground();
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void promoteToForeground() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        PebbleIndexContract.CHANNEL_ID,
                        PebbleIndexContract.CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_LOW
                );
                channel.setShowBadge(false);
                NotificationManager manager =
                        (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                manager.createNotificationChannel(channel);
            }
            Intent launch = new Intent(this, MainActivity.class);
            PendingIntent pending = PendingIntent.getActivity(
                    this,
                    0,
                    launch,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            Notification notification = new NotificationCompat.Builder(this, PebbleIndexContract.CHANNEL_ID)
                    .setContentTitle("Listening for Index 01")
                    .setContentText("Notesnook will save ring recordings on this phone, offline")
                    .setSmallIcon(R.drawable.ic_stat_name)
                    .setContentIntent(pending)
                    .setOngoing(true)
                    .setSilent(true)
                    .build();
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(
                        PebbleIndexContract.KEEP_ALIVE_NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                );
            } else {
                startForeground(PebbleIndexContract.KEEP_ALIVE_NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            Log.e(TAG, "Could not promote keep-alive", e);
            stopSelf();
        }
    }
}
