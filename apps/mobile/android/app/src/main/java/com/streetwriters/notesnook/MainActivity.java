package com.streetwriters.notesnook;

import com.facebook.react.ReactActivity;
import android.content.Intent; 
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import com.facebook.react.ReactActivityDelegate;
import com.zoontek.rnbootsplash.RNBootSplash; 
import com.zoontek.rnbars.RNBars; // <- add this necessary import

public class MainActivity extends ReactActivity {


  @Override
    protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && BuildConfig.DEBUG) {
      WebView.setWebContentsDebuggingEnabled(true);
    }

    try {
      startService(new Intent(getBaseContext(), OnClearFromRecentService.class));
    } catch (Exception e) {

    }

  }
  

    @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName()) {

      @Override
      protected void loadApp(String appKey) {
        RNBootSplash.init(MainActivity.this);
        RNBars.init(MainActivity.this, "dark-content");
        super.loadApp(appKey);
      }
    };
  }

@Override
public void onNewIntent(Intent intent) {
  super.onNewIntent(intent);
  setIntent(intent);
}

 @Override
public void onConfigurationChanged(Configuration newConfig) {
  super.onConfigurationChanged(newConfig);
  getReactInstanceManager().onConfigurationChanged(this, newConfig);
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
