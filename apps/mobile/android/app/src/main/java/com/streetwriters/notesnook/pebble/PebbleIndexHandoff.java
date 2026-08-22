package com.streetwriters.notesnook.pebble;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Process;
import android.util.Log;

import com.facebook.react.HeadlessJsTaskService;

/**
 * Shared hop from Activity / Receiver into the capture FGS, plus the
 * Pebble-package allowlist (replaces the custom permission, which Android
 * does not grant across independently-installed apps).
 */
public final class PebbleIndexHandoff {
    private static final String TAG = "PebbleIndexHandoff";

    private PebbleIndexHandoff() {}

    public static boolean isAllowedUid(Context context, int uid) {
        if (uid == Process.myUid()) return true;
        PackageManager pm = context.getPackageManager();
        String[] packages = pm.getPackagesForUid(uid);
        if (packages == null) return false;
        for (String pkg : packages) {
            if (isAllowedPackage(pkg)) return true;
        }
        return false;
    }

    public static boolean isAllowedPackage(String pkg) {
        return PebbleIndexContract.PEBBLE_PACKAGE.equals(pkg);
    }

    public static boolean startCaptureService(Context context, Intent source) {
        if (!PebbleIndexPrefs.captureEnabled(context)) {
            Log.i(TAG, "Capture disabled, dropping Index intent");
            return false;
        }
        Intent service = new Intent(context, PebbleIndexCaptureService.class);
        service.setAction(PebbleIndexContract.ACTION);
        if (source != null) {
            if (source.getExtras() != null) {
                service.putExtras(source.getExtras());
            }
            service.setData(source.getData());
            service.setClipData(source.getClipData());
            if (source.getType() != null) {
                service.setType(source.getType());
            }
            service.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(service);
            } else {
                context.startService(service);
            }
            HeadlessJsTaskService.acquireWakeLockNow(context);
            Log.i(TAG, "Started capture service");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to start capture service, enqueueing only", e);
            if (source != null) {
                try {
                    PebbleIndexInbox.enqueue(context, source);
                } catch (Exception ignored) {}
            }
            return false;
        }
    }
}
