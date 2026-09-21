package com.streetwriters.notesnook.pebble;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * Fallback path if Pebble cannot start the capture service or trampoline
 * activity directly. Always hops to {@link PebbleIndexCaptureService}.
 */
public class PebbleIndexCaptureReceiver extends BroadcastReceiver {
    private static final String TAG = "PebbleIndexReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !PebbleIndexContract.ACTION.equals(intent.getAction())) {
            return;
        }
        if (!senderAllowed(context)) {
            Log.w(TAG, "Rejected capture broadcast from unknown sender");
            return;
        }
        PebbleIndexHandoff.startCaptureService(context, intent);
    }

    private boolean senderAllowed(Context context) {
        if (Build.VERSION.SDK_INT >= 34) {
            String pkg = getSentFromPackage();
            if (pkg != null) {
                return PebbleIndexHandoff.isAllowedPackage(pkg);
            }
            int uid = getSentFromUid();
            if (uid >= 0) {
                return PebbleIndexHandoff.isAllowedUid(context, uid);
            }
        }
        return true;
    }
}
