package com.streetwriters.notesnook;

import android.app.Activity;
import android.os.Build;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;

import com.facebook.react.ReactHost;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.PixelUtil;

/**
 * Keeps React Native's display metrics pointed at the display the foreground activity is actually
 * on, so the app renders correctly on external displays and in desktop mode (Samsung DeX, freeform
 * windows).
 *
 * <p>React Native initializes {@link DisplayMetricsHolder} from the *application* context, whose
 * WindowManager always resolves to {@code Display.DEFAULT_DISPLAY} -- the built-in panel -- no
 * matter which display the activity is on. Everything downstream reads those metrics:
 * {@code PixelUtil} converts every dp/px value with {@code getScreenDisplayMetrics().density}, and
 * react-native-screens converts each Screen's measured pixel frame back to dp with it before
 * pushing that frame into the shadow tree.
 *
 * <p>DeX runs at 160dpi (density 1.0) while a modern phone panel is ~2.8-3.5. So a 1920px-wide
 * window is reported to JS as {@code 1920 / phoneDensity} dp, while the surface itself lays out at
 * the real display density (that one comes from the activity context and is already correct). The
 * app ends up rendered into the top-left {@code externalDensity / phoneDensity} fraction of the
 * window and never sees the remaining space.
 *
 * <p>Note this holder is process-global, but every {@code ReactActivity} in this app has its own
 * surface and can be on a different display. Whichever activity most recently resumed or handled a
 * configuration change wins, which is why each of them syncs rather than only the main one.
 *
 * <p>Uses only public React Native API, so it works against the prebuilt AAR -- no patching.
 */
final class DisplayMetricsSync {

  static final String TAG = "NNDisplayMetrics";

  private DisplayMetricsSync() {
  }

  /**
   * Diagnostic: dumps what the activity's display says versus what React Native is actually using.
   * On a correctly synced app these agree; a mismatch on {@code PixelUtil.density} is the bug this
   * class exists to fix, and the ratio between the two is the fraction of the window the UI ends
   * up rendering into. Debug builds only. Filter logcat on {@link #TAG}.
   */
  static void logState(Activity activity, String where) {
    if (!BuildConfig.DEBUG) return;
    try {
      DisplayMetrics res = activity.getResources().getDisplayMetrics();
      android.content.res.Configuration cfg = activity.getResources().getConfiguration();

      int displayId = -1;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && activity.getDisplay() != null) {
        displayId = activity.getDisplay().getDisplayId();
      }

      String rnScreen = "<uninitialized>";
      String rnWindow = "<uninitialized>";
      String pixelUtil = "<uninitialized>";
      try {
        DisplayMetrics s = DisplayMetricsHolder.getScreenDisplayMetrics();
        rnScreen = s.widthPixels + "x" + s.heightPixels + " density=" + s.density
                + " dpi=" + s.densityDpi;
      } catch (Throwable ignored) {
      }
      try {
        DisplayMetrics w = DisplayMetricsHolder.getWindowDisplayMetrics();
        rnWindow = w.widthPixels + "x" + w.heightPixels + " density=" + w.density
                + " dpi=" + w.densityDpi;
      } catch (Throwable ignored) {
      }
      try {
        pixelUtil = String.valueOf(PixelUtil.getDisplayMetricDensity());
      } catch (Throwable ignored) {
      }

      Log.i(TAG, "[" + where + "] displayId=" + displayId
              + " | activity: " + res.widthPixels + "x" + res.heightPixels
              + " density=" + res.density + " dpi=" + res.densityDpi
              + " cfg=" + cfg.screenWidthDp + "x" + cfg.screenHeightDp + "dp"
              + " sw=" + cfg.smallestScreenWidthDp + "dp cfgDpi=" + cfg.densityDpi
              + " | RN screen: " + rnScreen
              + " | RN window: " + rnWindow
              + " | PixelUtil.density=" + pixelUtil);
    } catch (Throwable ignored) {
    }
  }

  /**
   * Re-points React Native's window and screen metrics at {@code activity}'s display.
   *
   * <p>Must be called *after* {@code super.onCreate()}, and after {@code super} in
   * {@code onResume()} and {@code onConfigurationChanged()}. React Native calls the unconditional
   * {@code initDisplayMetrics()} during startup and again from
   * {@code ReactHostImpl.onConfigurationChanged()}; that method assigns the window metrics from the
   * given context's resources but then overwrites the *screen* metrics from
   * {@code wm.defaultDisplay}, so it re-installs the built-in panel's density every time. Since
   * {@code PixelUtil} reads the screen metrics, ours have to be applied last to win.
   *
   * <p>Measured on an emulator with a 213dpi secondary display and a 544dpi built-in panel:
   * syncing before {@code super.onCreate()} alone left {@code PixelUtil.density} at 3.4 instead of
   * 1.33, and the UI rendered into the top-left 39% (= 213/544) of the window.
   */
  static void sync(Activity activity) {
    try {
      // The activity's configuration is the authority on what a dp means for this window.
      DisplayMetrics windowMetrics = new DisplayMetrics();
      windowMetrics.setTo(activity.getResources().getDisplayMetrics());

      DisplayMetrics screenMetrics = new DisplayMetrics();
      screenMetrics.setTo(windowMetrics);

      Display display = null;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        display = activity.getDisplay();
      }
      if (display == null) {
        display = activity.getWindowManager().getDefaultDisplay();
      }
      if (display != null) {
        // Full size of the display the activity is on, for Dimensions.get("screen").
        display.getRealMetrics(screenMetrics);
        // getRealMetrics can report the panel's physical density rather than the effective one the
        // activity is configured with. PixelUtil scales the entire UI by this value, so it has to
        // match the activity configuration or we reintroduce the very mismatch we're fixing.
        screenMetrics.density = windowMetrics.density;
        screenMetrics.densityDpi = windowMetrics.densityDpi;
        screenMetrics.scaledDensity = windowMetrics.scaledDensity;
      }

      DisplayMetricsHolder.setWindowDisplayMetrics(windowMetrics);
      DisplayMetricsHolder.setScreenDisplayMetrics(screenMetrics);
    } catch (Throwable ignored) {
      // Never let display syncing take the app down; worst case we keep React Native's own metrics.
    }
  }

  /**
   * Tells JS to re-read Dimensions after {@link #sync(Activity)} changed them. Mirrors the payload
   * React Native's own DeviceInfoModule emits, which is not reachable from app code.
   */
  static void emitDimensionsChanged(Activity activity, ReactHost reactHost) {
    try {
      if (reactHost == null) return;
      ReactContext reactContext = reactHost.getCurrentReactContext();
      if (reactContext == null) return;
      reactContext.emitDeviceEvent(
              "didUpdateDimensions",
              DisplayMetricsHolder.getDisplayMetricsWritableMap(
                      activity.getResources().getConfiguration().fontScale));
    } catch (Throwable ignored) {
    }
  }
}
