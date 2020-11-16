package com.streetwriters.notesnook;


import android.view.WindowManager;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;


public class RCTNNativeModule extends ReactContextBaseJavaModule {

    ReactContext mContext;

    public RCTNNativeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mContext = reactContext;

    }

    @Override
    public String getName() {
        return "NNativeModule";
    }

    @ReactMethod
    public void setSecureMode(final boolean mode) {
        mContext.getCurrentActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (mode) {
                    mContext.getCurrentActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
                } else {
                    mContext.getCurrentActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                }
            }
        });



    }


}
