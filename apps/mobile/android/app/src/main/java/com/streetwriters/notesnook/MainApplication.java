package com.streetwriters.notesnook;

import android.app.Application;
import android.content.Context;

import com.RNFetchBlob.RNFetchBlob;
import com.dooboolab.RNIap.RNIapModule;
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
import com.learnium.RNDeviceInfo.RNDeviceModule;
import com.oblador.keychain.KeychainPackage;
import com.onibenjo.htmltopdf.RNHTMLtoPDFModule;
import com.vinzscam.reactnativefileviewer.RNFileViewerModule;

import cl.json.RNShareModule;
import io.github.elyx0.reactnativedocumentpicker.DocumentPickerModule;
import px.tooltips.RNTooltipsModule;

public class MainApplication extends MultiDexApplication implements ReactApplication {

    private final ReactNativeHost mReactNativeHost =
            new ReactNativeHost(this) {
                @Override
                public boolean getUseDeveloperSupport() {
                    return BuildConfig.DEBUG;
                }

                @Override
                protected List<ReactPackage> getPackages() {

                    List<ReactPackage> packages = new PackageList(this).getPackages();
                    //packages.add(new KeychainPackage(new KeychainModuleBuilder().withoutWarmUp()));

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
                                case "RNIapModule":
                                    return new RNIapModule(reactContext);
                                default:
                                    throw new IllegalArgumentException("Could not find module $name");
                            }

                        }

                        @Override
                        public ReactModuleInfoProvider getReactModuleInfoProvider() {

                            return new ReactModuleInfoProvider() {
                                @Override
                                public Map<String, ReactModuleInfo> getReactModuleInfos() {
                                    Map<String, ReactModuleInfo> map = new HashMap<String, ReactModuleInfo>() ;
                                    map.put("NNativeModule", getModuleInfo("NNativeModule", "com.streetwriters.notesnook.NNativeModule"));
                                    map.put("RNTooltips", getModuleInfo("RNTooltips", "px.tooltips.RNTooltipsModule"));
                                    map.put("RNHTMLtoPDF", getModuleInfo("RNHTMLtoPDF", "com.onibenjo.htmltopdf.RNHTMLtoPDFModule"));
                                    map.put("RNFileViewer", getModuleInfo("RNFileViewer", "com.vinzscam.reactnativefileviewer.RNFileViewerModule"));
                                    map.put("RNDocumentPicker", getModuleInfo("RNDocumentPicker", "io.github.elyx0.reactnativedocumentpicker.DocumentPickerModule"));
                                    map.put("RNShare", getModuleInfo("RNShare", "cl.json.RNShareModule"));
                                    map.put("RNIapModule", getModuleInfo("RNIapModule", "com.dooboolab.RNIap.RNIapModule"));

                                    return map;
                                }
                            };

                        }
                    });

                    return packages;
                }

                @Override
                protected String getJSMainModuleName() {
                    return "index";
                }
            };

    public ReactModuleInfo getModuleInfo(String reactClass, String className) {

        return new ReactModuleInfo(reactClass, className, true, false, false, false, true);

    }

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
        initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    }

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
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            } catch (NoSuchMethodException e) {
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            } catch (InvocationTargetException e) {
                e.printStackTrace();
            }
        }
    }
}
