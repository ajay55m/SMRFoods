# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.

# Keep annotations, signatures, inner classes for reflection
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# React Native core keep rules & DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keep @com.facebook.proguard.annotations.DoNotStripAny class * {
    *;
}
-keep @com.facebook.jni.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.jni.annotations.DoNotStrip *;
}
-keep @com.facebook.jni.annotations.DoNotStripAny class * {
    *;
}

-keep class * implements com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

-keep class com.facebook.react.** { *; }
-keep interface com.facebook.react.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep interface com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep interface com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.turbomodule.core.** { *; }
-keep class com.facebook.react.internal.turbomodule.core.** { *; }

# Hermes Engine & SoLoader
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.soloader.** { *; }
-keep class com.facebook.jni.** { *; }

-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**
-dontwarn com.facebook.flipper.**

# Networking & OkHttp
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# App native models & package classes
-keep class com.smrfoods.** { *; }

# React Native libraries / Native modules
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }
-keep class com.reactnativecommunity.netinfo.** { *; }
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-keep class com.reactnativekeychain.** { *; }
-keep class com.reactnativecommunity.webview.** { *; }
-keep class com.learnium.RNDeviceInfo.** { *; }

# In-App Updates & Google Play Core
-keep class com.sudoplz.rninappupdates.** { *; }
-keep class com.google.android.play.core.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.play.core.**


