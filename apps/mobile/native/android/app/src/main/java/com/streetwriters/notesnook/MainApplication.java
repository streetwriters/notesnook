package com.streetwriters.notesnook;

import android.content.Context;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import androidx.multidex.MultiDexApplication;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.onibenjo.htmltopdf.RNHTMLtoPDFModule;
import com.reactnativedocumentpicker.DocumentPickerModule;
import com.vinzscam.reactnativefileviewer.RNFileViewerModule;
import com.facebook.react.config.ReactFeatureFlags;
import com.streetwriters.notesnook.newarchitecture.MainApplicationReactNativeHost;

import cl.json.RNShareModule;
import px.tooltips.RNTooltipsModule;
//import io.csie.kudo.reactnative.v8.executor.V8ExecutorFactory;

public class MainApplication extends MultiDexApplication implements ReactApplication {
    private final ReactNativeHost mNewArchitectureNativeHost =
            new MainApplicationReactNativeHost(this);

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
                    List<ReactPackage> packages = new PackageList(this).getPackages();
                    packages.add(new TurboReactPackage() {
                        @Override
                        public NativeModule getModule(String name, ReactApplicationContext reactContext) {

                            switch (name) {
                                case "NNativeModule":
                                    return new RCTNNativeModule(reactContext);
                                case "RNTooltips":
                                    return new RNTooltipsModule(reactContext);
                                case "RNHTMLtoPDF":
                                    return new RNHTMLtoPDFModule(reactContext);
                                case "RNFileViewer":
                                    return new RNFileViewerModule(reactContext);
                                case "RNDocumentPicker":
                                    return new DocumentPickerModule(reactContext);
                                case "RNShare":
                                    return new RNShareModule(reactContext);
                                default:
                                    throw new IllegalArgumentException("Could not find module $name");
                            }

                        }

                        @Override
                        public ReactModuleInfoProvider getReactModuleInfoProvider() {

                            return new ReactModuleInfoProvider() {
                                @Override
                                public Map<String, ReactModuleInfo> getReactModuleInfos() {
                                    Map<String, ReactModuleInfo> map = new HashMap<String, ReactModuleInfo>();
                                    map.put("NNativeModule", getModuleInfo("NNativeModule", "com.streetwriters.notesnook.NNativeModule"));
                                    map.put("RNTooltips", getModuleInfo("RNTooltips", "px.tooltips.RNTooltipsModule"));
                                    map.put("RNHTMLtoPDF", getModuleInfo("RNHTMLtoPDF", "com.onibenjo.htmltopdf.RNHTMLtoPDFModule"));
                                    map.put("RNFileViewer", getModuleInfo("RNFileViewer", "com.vinzscam.reactnativefileviewer.RNFileViewerModule"));
                                    map.put("RNDocumentPicker", getModuleInfo("RNDocumentPicker", "io.github.elyx0.reactnativedocumentpicker.DocumentPickerModule"));
                                    map.put("RNShare", getModuleInfo("RNShare", "cl.json.RNShareModule"));
                                    return map;
                                }
                            };

                        }
                    });
                    if (!BuildConfig.IS_GITHUB_RELEASE) {
                        try {
                            /**
                             * We use reflection here because SplitModulePackage & PlayCore libraries are not
                             * available in Github/Fdroid release.
                             */
                            Class<?> SplitCompat = Class.forName("com.google.android.play.core.splitcompat.SplitCompat");
                            SplitCompat.getMethod("install", Context.class)
                                    .invoke(null, this.getApplication());

                            Class<?> SplitModulePackage = Class.forName("com.streetwriters.notesnook.SplitModulePackage");
                            packages.add((ReactPackage) SplitModulePackage.getConstructor().newInstance());
                        } catch (ClassNotFoundException | InvocationTargetException | NoSuchMethodException | IllegalAccessException | InstantiationException e) {
                            e.printStackTrace();
                        }


                    }
                    return packages;
                }

                @Override
                protected String getJSMainModuleName() {
                    return "index";
                }
            };

    /**
     * Loads Flipper in React Native templates. Call this in the onCreate method with something like
     * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
     *
     * @param context
     * @param reactInstanceManager
     */
    private static void initializeFlipper(
            Context context, ReactInstanceManager reactInstanceManager) {
        if (BuildConfig.DEBUG) {
            try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
                Class<?> aClass = Class.forName("com.streetwriters.notesnook.ReactNativeFlipper");
                aClass
                        .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
                        .invoke(null, context, reactInstanceManager);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException | InvocationTargetException e) {
                e.printStackTrace();
            }
        }
    }

    public ReactModuleInfo getModuleInfo(String reactClass, String className) {

        return new ReactModuleInfo(reactClass, className, true, false, false, false, true);

    }

    @Override
    public ReactNativeHost getReactNativeHost() {
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            return mNewArchitectureNativeHost;
        } else {
            return mReactNativeHost;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        // If you opted-in for the New Architecture, we enable the TurboModule system
        ReactFeatureFlags.useTurboModules = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        SoLoader.init(this, /* native exopackage */ false);
        initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    }
}
