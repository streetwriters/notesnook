package com.streetwriters.notesnook;

import com.facebook.react.ReactActivity;
import android.content.Intent;
import android.content.res.Configuration;
import androidx.core.graphics.Insets;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import androidx.core.view.OnApplyWindowInsetsListener;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.zoontek.rnbootsplash.RNBootSplash;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    RNBootSplash.init(this, R.style.BootTheme);

    // Seed the metrics before React Native starts up...
    DisplayMetricsSync.sync(this);

    super.onCreate(null);

    // ...and again afterwards: super.onCreate() runs React Native's own
    // initDisplayMetrics(), which unconditionally overwrites the screen metrics with the
    // *default* display's. This second call is the one that actually sticks.
    DisplayMetricsSync.sync(this);
    DisplayMetricsSync.logState(this, "onCreate:after-super+sync");

    if (BuildConfig.DEBUG) {
      WebView.setWebContentsDebuggingEnabled(true);
    }

  }

  @Override
  protected void onResume() {
    super.onResume();

    // Belt and braces: the first real layout pass happens after this, so make sure the metrics
    // are still ours by then, and let JS re-read Dimensions if anything did change them.
    DisplayMetricsSync.sync(this);
    DisplayMetricsSync.emitDimensionsChanged(this, getReactHost());
    DisplayMetricsSync.logState(this, "onResume");
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
            this,
            getMainComponentName(),
            DefaultNewArchitectureEntryPoint.getFabricEnabled());
  }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    getReactHost().onConfigurationChanged(this);

    DisplayMetricsSync.logState(this, "onConfigurationChanged:before-sync");
    // Must run after the calls above, which put the built-in panel's metrics back.
    // See DisplayMetricsSync.
    DisplayMetricsSync.sync(this);
    DisplayMetricsSync.emitDimensionsChanged(this, getReactHost());
    DisplayMetricsSync.logState(this, "onConfigurationChanged:after-sync");

    Intent intent = new Intent("onConfigurationChanged");
    intent.putExtra("newConfig", newConfig);
    this.sendBroadcast(intent);
  }

  @Override
  protected String getMainComponentName() {
    return "Notesnook";
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    moveTaskToBack(true);
  }

}
