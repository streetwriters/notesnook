package com.streetwriters.notesnook;


import android.graphics.Color;
import android.view.WindowManager;

import com.facebook.react.bridge.Promise;
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
    public void setBackgroundColor(final String color) {

        try {
           getCurrentActivity().getWindow().getDecorView().setBackgroundColor(Color.parseColor(color));
        } catch (Exception e) {

        }
    }

    @ReactMethod
    public void getActivityName(Promise promise) {
        try {
            promise.resolve(getCurrentActivity().getClass().getSimpleName());
        } catch (Exception e) {
            promise.resolve(null);
        }
    }



    @ReactMethod
    public void setSecureMode(final boolean mode) {
        try {

            getCurrentActivity().runOnUiThread(() -> {

                try {
                    if (mode)
                        getCurrentActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
                    else
                        getCurrentActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                } catch (Exception e) {
                }

            });
        } catch (Exception e) {

        }
    }



}
