package com.streetwriters.notesnook.pebble;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Binder;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.streetwriters.notesnook.R;

import javax.annotation.Nullable;

/**
 * Receives an explicit Index capture intent, copies audio into the private
 * inbox, then runs a Headless JS task that creates the Notesnook note.
 *
 * Started from Pebble's connected-device FGS via startForegroundService, so
 * it works with the screen off and without a user tap.
 */
public class PebbleIndexCaptureService extends HeadlessJsTaskService {
    private static final String TAG = "PebbleIndexCapture";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        promoteToForeground();
        if (intent != null && PebbleIndexContract.ACTION.equals(intent.getAction())) {
            int uid = Binder.getCallingUid();
            if (uid != android.os.Process.SYSTEM_UID
                    && !PebbleIndexHandoff.isAllowedUid(this, uid)) {
                Log.w(TAG, "Rejected capture from uid " + uid);
                stopSelf(startId);
                return START_NOT_STICKY;
            }
            if (!PebbleIndexPrefs.captureEnabled(this)) {
                Log.i(TAG, "Capture disabled");
                stopSelf(startId);
                return START_NOT_STICKY;
            }
            try {
                String inboxId = PebbleIndexInbox.enqueue(this, intent);
                Log.i(TAG, "Enqueued capture " + inboxId);
                notifyJs();
            } catch (Exception e) {
                Log.e(TAG, "Failed to enqueue capture", e);
            }
        }
        return super.onStartCommand(intent, flags, startId);
    }

    @Override
    protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        WritableMap data = Arguments.createMap();
        data.putString("inbox", PebbleIndexInbox.pendingAsJson(this).toString());
        return new HeadlessJsTaskConfig(
                PebbleIndexContract.HEADLESS_TASK,
                data,
                120000,
                true
        );
    }

    @Override
    public void onHeadlessJsTaskFinish(int taskId) {
        super.onHeadlessJsTaskFinish(taskId);
        stopSelf();
    }

    private void notifyJs() {
        try {
            ReactContext ctx = null;
            try {
                ctx = getReactNativeHost()
                        .getReactInstanceManager()
                        .getCurrentReactContext();
            } catch (Throwable ignored) {
            }
            if (ctx == null) {
                Log.i(TAG, "No React context yet; headless/AppState will drain inbox");
                return;
            }
            String json = PebbleIndexInbox.pendingAsJson(this).toString();
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("PEBBLE_INDEX_CAPTURE", json);
            Log.i(TAG, "Emitted PEBBLE_INDEX_CAPTURE to JS");
        } catch (Exception e) {
            Log.w(TAG, "Could not emit capture to JS", e);
        }
    }

    private void promoteToForeground() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        PebbleIndexContract.CHANNEL_ID,
                        PebbleIndexContract.CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Receives Index 01 recordings on this phone");
                NotificationManager manager =
                        (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                manager.createNotificationChannel(channel);
            }
            Notification notification = new NotificationCompat.Builder(this, PebbleIndexContract.CHANNEL_ID)
                    .setContentTitle("Saving Index recording")
                    .setContentText("Writing transcription and audio into Notesnook")
                    .setSmallIcon(R.drawable.ic_stat_name)
                    .setOngoing(true)
                    .build();
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(
                        PebbleIndexContract.CAPTURE_NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
                );
            } else {
                startForeground(PebbleIndexContract.CAPTURE_NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            Log.e(TAG, "Could not promote capture service", e);
        }
    }
}
