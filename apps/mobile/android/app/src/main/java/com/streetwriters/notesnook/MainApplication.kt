package com.streetwriters.notesnook
 
import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import org.wonday.orientation.OrientationActivityLifecycle;

class MainApplication : Application(), ReactApplication {
    override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(NNativeModulePackage());
          // Prebuilt JSI/Fabric packages that are excluded from autolinking:
          addIfMissing("com.margelo.rnquicksqlite.SequelPackage")
          addIfMissing("com.fastopenpgp.FastOpenpgpPackage")
          addIfMissing("com.swmansion.rnscreens.RNScreensPackage")
          addIfMissing("com.swmansion.gesturehandler.RNGestureHandlerPackage")
          addIfMissing("com.ammarahmed.mmkv.RNMMKVPackage")
          addIfMissing("com.margelo.nitro.NitroModulesPackage")
          addIfMissing("com.margelo.nitro.nitroclouduploader.NitroCloudUploaderPackage")
          addIfMissing("com.worklets.WorkletsPackage")
          addIfMissing("com.swmansion.reanimated.ReanimatedPackage")
        },
    )
  }

  private fun MutableList<ReactPackage>.addIfMissing(className: String) {
    if (none { it.javaClass.name == className }) {
      try {
        val clazz = Class.forName(className)
        val pkg = clazz.getConstructor().newInstance() as ReactPackage
        add(pkg)
      } catch (e: Throwable) {
        // Ignored: package class not found or instantiation failed
      }
    }
  }
 
  override fun onCreate() {
    super.onCreate()
      registerActivityLifecycleCallbacks(OrientationActivityLifecycle.getInstance());
    loadReactNative(this)
  }
}