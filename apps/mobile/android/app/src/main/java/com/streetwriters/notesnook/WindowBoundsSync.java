package com.streetwriters.notesnook;

import android.app.Activity;
import android.graphics.Rect;
import android.os.Build;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import com.facebook.react.ReactHost;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import java.lang.ref.WeakReference;
import java.util.WeakHashMap;

/**
 * React Native sizes its window from {@code Resources.getDisplayMetrics()} and
 * often the application context, which on a freeform / pop-up window stays at
 * the physical display size. Yoga then lays the tree out wider than the window
 * and the system clips it.
 *
 * <p>This reads the activity configuration and {@code WindowMetrics} (the
 * current window, not the display), publishes that size to JS, and, when the
 * content view itself is still the full display, pads it so match_parent
 * children measure to the window.
 */
final class WindowBoundsSync {
  private static final WeakHashMap<Activity, Boolean> INSTALLED = new WeakHashMap<>();
  private static int lastEmitWidth = -1;
  private static int lastEmitHeight = -1;

  private WindowBoundsSync() {}

  static void install(Activity activity, ReactHost host) {
    if (activity == null) return;
    View content = activity.findViewById(android.R.id.content);
    if (content == null) return;
    if (INSTALLED.containsKey(activity)) return;
    INSTALLED.put(activity, Boolean.TRUE);
    WeakReference<Activity> activityRef = new WeakReference<>(activity);
    content.addOnLayoutChangeListener(
        (v, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) -> {
          if (right - left == oldRight - oldLeft && bottom - top == oldBottom - oldTop) {
            return;
          }
          Activity current = activityRef.get();
          if (current == null) return;
          sync(current, host);
        });
  }

  @SuppressWarnings("deprecation")
  static void sync(Activity activity, ReactHost host) {
    if (activity == null) return;
    if (Looper.myLooper() != Looper.getMainLooper()) {
      activity.runOnUiThread(() -> sync(activity, host));
      return;
    }

    DisplayMetrics metrics = activity.getResources().getDisplayMetrics();
    float density = metrics.density > 0 ? metrics.density : 1f;
    int threshold = Math.round(48f * density);

    int configWidth =
        Math.round(activity.getResources().getConfiguration().screenWidthDp * density);
    int configHeight =
        Math.round(activity.getResources().getConfiguration().screenHeightDp * density);

    int windowWidth = 0;
    int windowHeight = 0;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      Rect bounds = activity.getWindowManager().getCurrentWindowMetrics().getBounds();
      windowWidth = bounds.width();
      windowHeight = bounds.height();
    }

    int targetWidth = minPositive(configWidth, windowWidth);
    int targetHeight = minPositive(configHeight, windowHeight);

    View content = activity.findViewById(android.R.id.content);
    int contentWidth = content != null ? content.getWidth() : 0;
    int contentHeight = content != null ? content.getHeight() : 0;

      int padRight = 0;
      int padBottom = 0;
      if (content != null && targetWidth > 0 && targetHeight > 0) {
        // System bars are a small slice of the display. A pop-up is not.
        // Padding for the small slice would letterbox a normal phone.
        float widthSlack = Math.max(threshold, contentWidth * 0.12f);
        float heightSlack = Math.max(threshold, contentHeight * 0.12f);
        if (contentWidth - targetWidth > widthSlack) {
          padRight = contentWidth - targetWidth;
        }
        if (contentHeight - targetHeight > heightSlack) {
          padBottom = contentHeight - targetHeight;
        }
        if (content.getPaddingRight() != padRight || content.getPaddingBottom() != padBottom) {
          content.setPadding(
              content.getPaddingLeft(), content.getPaddingTop(), padRight, padBottom);
        }
      }

      int emitWidth = targetWidth > 0 ? targetWidth : contentWidth;
      int emitHeight = targetHeight > 0 ? targetHeight : contentHeight;
      if (emitWidth <= 0 || emitHeight <= 0) return;

    DisplayMetrics windowMetrics = new DisplayMetrics();
    windowMetrics.setTo(metrics);
    windowMetrics.widthPixels = emitWidth;
    windowMetrics.heightPixels = emitHeight;
    DisplayMetricsHolder.setWindowDisplayMetrics(windowMetrics);

    DisplayMetrics screenMetrics = new DisplayMetrics();
    screenMetrics.setTo(windowMetrics);
    Display display = null;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      display = activity.getDisplay();
    }
    if (display == null) {
      WindowManager wm = activity.getWindowManager();
      if (wm != null) {
        display = wm.getDefaultDisplay();
      }
    }
    if (display != null) {
      display.getRealMetrics(screenMetrics);
      // PixelUtil scales by the screen density. On a secondary display
      // (DeX / desktop mode) that density must follow the activity, not the
      // built-in panel, or the UI renders into a corner of the window.
      screenMetrics.density = windowMetrics.density;
      screenMetrics.densityDpi = windowMetrics.densityDpi;
      screenMetrics.scaledDensity = windowMetrics.scaledDensity;
    }
    DisplayMetricsHolder.setScreenDisplayMetrics(screenMetrics);

    if (emitWidth == lastEmitWidth && emitHeight == lastEmitHeight) return;
    lastEmitWidth = emitWidth;
    lastEmitHeight = emitHeight;

    if (host == null) return;
    ReactContext context = host.getCurrentReactContext();
    if (context == null) {
      // Metrics are stored for the next constants read. Allow another emit
      // once the React context exists.
      lastEmitWidth = -1;
      lastEmitHeight = -1;
      return;
    }

    double fontScale = activity.getResources().getConfiguration().fontScale;
    context.emitDeviceEvent(
        "didUpdateDimensions", DisplayMetricsHolder.getDisplayMetricsWritableMap(fontScale));

    WritableMap bounds = Arguments.createMap();
    bounds.putDouble("width", emitWidth / density);
    bounds.putDouble("height", emitHeight / density);
    context.emitDeviceEvent("nnWindowBounds", bounds);
  }

  private static int minPositive(int a, int b) {
    if (a > 0 && b > 0) return Math.min(a, b);
    return a > 0 ? a : b;
  }
}
