package com.streetwriters.notesnook;

import com.facebook.react.ReactActivity;
import android.view.KeyEvent;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import android.content.Intent;

import android.content.res.Configuration;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import android.os.Bundle;
import com.facebook.react.ReactFragmentActivity;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactApplicationContext;
import android.view.WindowManager;
import android.os.Build;
import android.provider.Settings;
import android.net.Uri;
import android.widget.Toast;
import android.app.Activity;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.Arguments;
import android.database.Cursor;
import android.provider.MediaStore;
import androidx.annotation.Nullable;



public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
    @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
      if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN && this.getReactInstanceManager() != null) {
          this.getReactInstanceManager().showDevOptionsDialog();
          return true;
      }
      return super.onKeyUp(keyCode, event);
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
