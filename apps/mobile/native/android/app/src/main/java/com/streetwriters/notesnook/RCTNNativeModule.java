package com.streetwriters.notesnook;


import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.util.Log;
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

    @ReactMethod
    public void setAppState(final String appState) {
        SharedPreferences appStateDetails = getReactApplicationContext().getSharedPreferences("appStateDetails", Context.MODE_PRIVATE);
        SharedPreferences.Editor edit = appStateDetails.edit();
        edit.putString("appState", appState);
        edit.apply();
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String getAppState() {
        SharedPreferences appStateDetails = getReactApplicationContext().getSharedPreferences("appStateDetails", Context.MODE_PRIVATE);
        String appStateValue = appStateDetails.getString("appState", "");
        return appStateValue.isEmpty() ? null : appStateValue;
    }



}
