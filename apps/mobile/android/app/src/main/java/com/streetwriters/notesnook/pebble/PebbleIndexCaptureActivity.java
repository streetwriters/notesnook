package com.streetwriters.notesnook.pebble;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

/**
 * Visible-window trampoline so Pebble can deliver a capture even when
 * startForegroundService is blocked (missing custom permission, or BAL).
 * Finishes immediately after hopping to {@link PebbleIndexCaptureService}.
 */
public class PebbleIndexCaptureActivity extends Activity {
    private static final String TAG = "PebbleIndexActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent intent = getIntent();
        if (intent != null && PebbleIndexContract.ACTION.equals(intent.getAction())) {
            if (!callerAllowed()) {
                Log.w(TAG, "Rejected capture from " + launchedPackage());
            } else {
                PebbleIndexHandoff.startCaptureService(this, intent);
            }
        }
        finish();
    }

    private boolean callerAllowed() {
        String launched = launchedPackage();
        if (launched == null) {
            // startActivity (not for-result) often has a null calling package
            // on older APIs; the action + explicit component is the filter.
            return true;
        }
        return getPackageName().equals(launched)
                || PebbleIndexHandoff.isAllowedPackage(launched);
    }

    private String launchedPackage() {
        if (Build.VERSION.SDK_INT >= 31) {
            String pkg = getLaunchedFromPackage();
            if (pkg != null) return pkg;
        }
        return getCallingPackage();
    }
}
