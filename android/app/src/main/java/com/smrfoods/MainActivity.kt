package com.smrfoods

import android.os.Bundle
import android.webkit.WebView
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "SMRFoods"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
        try {
            WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        } catch (_: Exception) {}
    }

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}