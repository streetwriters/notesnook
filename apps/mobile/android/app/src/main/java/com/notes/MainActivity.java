package com.notes;

import com.facebook.react.ReactActivity;
import android.view.KeyEvent;
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
    return "Notes";
  }
}
