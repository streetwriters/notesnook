package com.streetwriters.notesnook;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;

import java.util.List;
import androidx.multidex.MultiDexApplication;

import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers;
import com.facebook.soloader.SoLoader;

//import io.csie.kudo.reactnative.v8.executor.V8ExecutorFactory;
import androidx.annotation.Nullable;

public class ShareApplication extends MultiDexApplication implements ReactApplication {
    private final ReactNativeHost mReactNativeHost =
            new ReactNativeHost(this) {
                @Override
                public boolean getUseDeveloperSupport() {
                    return BuildConfig.DEBUG;
                }

                // @Nullable
                // @Override
                // protected String getBundleAssetName() {
                //      final String v8BundleAssetName = V8ExecutorFactory.getBundleAssetName(getApplicationContext(), getUseDeveloperSupport());
                //      if (v8BundleAssetName != null) {
                //          return v8BundleAssetName;
                //      }
                //     return super.getBundleAssetName();
                // }

                // @Override
                // protected JavaScriptExecutorFactory getJavaScriptExecutorFactory() {
                //     return new V8ExecutorFactory(
                //             getApplicationContext(),
                //             getPackageName(),
                //             AndroidInfoHelpers.getFriendlyDeviceName(),
                //             getUseDeveloperSupport());
                // }

                @Override
                protected List<ReactPackage> getPackages() {
                    @SuppressWarnings("UnnecessaryLocalVariable")
                    List<ReactPackage> packages = new PackageList(this).getPackages();
                    // Packages that cannot be autolinked yet can be added manually here, for example:
                    // packages.add(new MyReactNativePackage());
                    packages.add(new NNativeModulePackage());
                    return packages;
                }

                @Override
                protected String getJSMainModuleName() {
                    return "index";
                }
            };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
    }

}