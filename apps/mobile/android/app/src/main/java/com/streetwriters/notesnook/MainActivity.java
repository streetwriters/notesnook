package com.streetwriters.notesnook;

import com.facebook.react.ReactActivity;
import android.content.Intent; 
import android.content.res.Configuration;
import android.os.Bundle;

import org.devio.rn.splashscreen.SplashScreen;

public class MainActivity extends ReactActivity {


  @Override
    protected void onCreate(Bundle savedInstanceState) {
    SplashScreen.show(this);
    super.onCreate(null);
    try {
      startService(new Intent(getBaseContext(), OnClearFromRecentService.class));
    } catch (Exception e) {

    }

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
