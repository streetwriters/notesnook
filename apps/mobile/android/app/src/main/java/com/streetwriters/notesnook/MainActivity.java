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
import com.reactnativecommunity.webview.RNCWebView;
import com.zoontek.rnbootsplash.RNBootSplash;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // Registered before any editor view is created. The WebView reads this
    // when the keyboard commits an image.
    RNCWebView.keyboardImageListener = KeyboardImagePaste::onReceive;
    RNBootSplash.init(this, R.style.BootTheme);

    super.onCreate(null);
    WindowBoundsSync.install(this, getReactHost());
    WindowBoundsSync.sync(this, getReactHost());
    attachKeyboardImages();
    if (BuildConfig.DEBUG) {
      WebView.setWebContentsDebuggingEnabled(true);
    }

  }

  @Override
  protected void onResume() {
    super.onResume();
    WindowBoundsSync.install(this, getReactHost());
    WindowBoundsSync.sync(this, getReactHost());
    attachKeyboardImages();
  }

  private void attachKeyboardImages() {
    if (getReactHost() != null) {
      KeyboardImagePaste.attach(getReactHost().getCurrentReactContext());
    }
    View content = findViewById(android.R.id.content);
    KeyboardImagePaste.watch(content);
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
    // Runs after React Native re-reads the application display metrics,
    // which otherwise stay at the full display size inside a pop-up window.
    WindowBoundsSync.sync(this, getReactHost());
    attachKeyboardImages();
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
