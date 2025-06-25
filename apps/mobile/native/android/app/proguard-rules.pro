# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep public class com.horcrux.svg.** {*;}
-keep class com.facebook.crypto.** {
   *;
}
-keep class com.facebook.react.turbomodule.** { *; }
-keepattributes *Annotation*
-keepclassmembers class ** {
  @org.greenrobot.eventbus.Subscribe <methods>;
}
-keep enum org.greenrobot.eventbus.ThreadMode { *; }

-keep class com.fingerprints.service.** { *; }
-dontwarn com.fingerprints.service.**

# Samsung Fingerprint
-keep class com.samsung.android.sdk.** { *; }
-dontwarn com.samsung.android.sdk.**

-keep public class com.dylanvann.fastimage.* {*;}
-keep public class com.dylanvann.fastimage.** {*;}
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep public class * extends com.bumptech.glide.module.AppGlideModule
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}

-keep class **.R$* { *; }

-dontwarn java.awt.*
-keep class com.sun.jna.* { *; }
-keep class net.jpountz.** { *; }
-keep class com.goterl.** { *; }
-keepclassmembers class * extends com.sun.jna.* { public *; }

-keep class com.streetwriters.notesnook.BuildConfig { *; }

# Reanimated 
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Wix
-keep class org.apache.commons.lang3.** { *; }
-keep class org.apache.commons.io.** { *; }

# Background fetch
-keep class com.transistorsoft.rnbackgroundfetch.HeadlessTask { *; }

#Gson
-keepattributes Signature
-keep class com.google.gson.reflect.TypeToken { *; }
-keep class * extends com.google.gson.reflect.TypeToken
-keep class com.streetwriters.notesnook.datatypes.* { *; }