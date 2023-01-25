package com.streetwriters.notesnook;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.play.core.splitcompat.SplitCompat;
import com.google.android.play.core.splitinstall.SplitInstallException;
import com.google.android.play.core.splitinstall.SplitInstallManager;
import com.google.android.play.core.splitinstall.SplitInstallManagerFactory;
import com.google.android.play.core.splitinstall.SplitInstallRequest;
import com.google.android.play.core.splitinstall.SplitInstallSessionState;
import com.google.android.play.core.splitinstall.SplitInstallStateUpdatedListener;
import com.google.android.play.core.splitinstall.model.SplitInstallSessionStatus;

@ReactModule(name = "SplitModuleLoader")
public class SplitModuleLoader extends ReactContextBaseJavaModule implements SplitInstallStateUpdatedListener {
    ReactContext rc;
    SplitInstallManager manager;
    ActivityEventListener listener = null;
    static int REQUEST_CODE = 25609;
    public SplitModuleLoader(ReactContext context) {
        rc = context;
        manager = SplitInstallManagerFactory.create(rc);
    }

    @ReactMethod
    public void installModule(String name, Promise promise) {
        SplitInstallRequest request = SplitInstallRequest.newBuilder().addModule(name).build();
        manager.startInstall(request).addOnFailureListener(e -> {
            Toast.makeText(rc,((SplitInstallException) e).getMessage(),Toast.LENGTH_LONG);
            promise.reject(e);
        }).addOnSuccessListener(integer -> {
            promise.resolve(integer);
        });
        manager.registerListener(this);
    }

    @ReactMethod
    public void getInstalledModules(Promise promise) {
        try {
            WritableArray array = Arguments.createArray();
            for (String item: manager.getInstalledModules()) {
                array.pushString(item);
            }
            promise.resolve(array);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void queryClass(String name, Promise promise) {
        try {
            String n = Class.forName(name).getName();
            promise.resolve(n);
        } catch (ClassNotFoundException e) {
            promise.resolve("CLASS NOT FOUND");
        }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        manager.unregisterListener(this);

    }

    @NonNull
    @Override
    public String getName() {
        return "SplitModuleLoader";
    }

    @Override
    public void onStateUpdate(@NonNull SplitInstallSessionState splitInstallSessionState) {
        WritableMap map = Arguments.createMap();
        switch (splitInstallSessionState.status()) {
            case SplitInstallSessionStatus.UNKNOWN:

            case SplitInstallSessionStatus.PENDING:
                map.putString("status", "pending");
            case SplitInstallSessionStatus.DOWNLOADING:
                long total = splitInstallSessionState.totalBytesToDownload();
                long downloaded = splitInstallSessionState.bytesDownloaded();
                map.putDouble("total", total);
                map.putDouble("downloaded", downloaded);
                map.putString("status", "downloading");
                break;
            case SplitInstallSessionStatus.DOWNLOADED:
                map.putString("status", "downloaded");
                break;
            case SplitInstallSessionStatus.INSTALLING:
                map.putString("status", "installing");
                break;
            case SplitInstallSessionStatus.INSTALLED:
                map.putString("status", "installed");
                break;
            case SplitInstallSessionStatus.FAILED:
                map.putString("status", "failed");
                map.putInt("errorCode", splitInstallSessionState.errorCode());
                break;
            case SplitInstallSessionStatus.CANCELED:
                map.putString("status", "canceled");
                break;
            case SplitInstallSessionStatus.REQUIRES_USER_CONFIRMATION:
                map.putString("status", "requires_user_confirmation");
                try {
                    if (listener != null) {
                        rc.removeActivityEventListener(listener);
                        listener = null;
                    }
                    listener = new ActivityEventListener() {
                        @Override
                        public void onActivityResult(Activity activity, int code, int result, @Nullable Intent intent) {
                            if (listener != null) {
                                rc.removeActivityEventListener(listener);
                            }
                            if (code == REQUEST_CODE && result == Activity.RESULT_OK) {
                                WritableMap map = Arguments.createMap();
                                map.putString("status", "user_permission_granted");
                                dispatchEvent("onModuleLoaderStateUpdate", map);
                            } else if (code == REQUEST_CODE && result == Activity.RESULT_CANCELED) {
                                WritableMap map = Arguments.createMap();
                                map.putString("status", "user_permission_canceled");
                                dispatchEvent("onModuleLoaderStateUpdate", map);
                            }
                        }
                        @Override
                        public void onNewIntent(Intent intent) {

                        }
                    };
                    rc.addActivityEventListener(listener);
                    manager.startConfirmationDialogForResult(splitInstallSessionState,getCurrentActivity(),REQUEST_CODE);
                } catch (Exception e) {

                }
                break;
            case SplitInstallSessionStatus.CANCELING:
                map.putString("status", "canceling");
                break;
        }
        dispatchEvent("onModuleLoaderStateUpdate", map);
    }

    protected void dispatchEvent(String eventName, WritableMap event) {
        rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, event);
    }
}
