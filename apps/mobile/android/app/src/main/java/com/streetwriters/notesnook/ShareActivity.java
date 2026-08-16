package com.streetwriters.notesnook;

import android.content.res.Configuration;
import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class ShareActivity extends ReactActivity {


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
                // If you opted-in for the New Architecture, we enable the Fabric Renderer.
                DefaultNewArchitectureEntryPoint.getFabricEnabled(), // fabricEnabled
                // If you opted-in for the New Architecture, we enable Concurrent React (i.e. React 18).
                DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled() // concurrentRootEnabled
        );
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Seed before startup, then re-apply: super.onCreate() runs React Native's own
        // initDisplayMetrics(), which overwrites the screen metrics. See DisplayMetricsSync.
        DisplayMetricsSync.sync(this);
        super.onCreate(null);
        DisplayMetricsSync.sync(this);
    }

    @Override
    protected void onResume() {
        super.onResume();
        DisplayMetricsSync.sync(this);
        DisplayMetricsSync.emitDimensionsChanged(this, getReactHost());
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        // Must run after super, which puts the built-in panel's metrics back.
        // See DisplayMetricsSync.
        DisplayMetricsSync.sync(this);
        DisplayMetricsSync.emitDimensionsChanged(this, getReactHost());
    }

    @Override
    protected String getMainComponentName() {
        return "NotesnookShare";
    }

}