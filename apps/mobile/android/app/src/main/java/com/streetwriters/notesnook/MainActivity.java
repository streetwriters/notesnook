package com.streetwriters.notesnook;

import com.facebook.react.ReactActivity;
import android.content.Intent; 
import android.content.res.Configuration;
import android.os.Bundle;
import android.view.WindowManager.LayoutParams;

import org.devio.rn.splashscreen.SplashScreen;

public class MainActivity extends ReactActivity {


  @Override
    protected void onCreate(Bundle savedInstanceState) {


    SplashScreen.show(this);

    super.onCreate(savedInstanceState);
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

  
}
