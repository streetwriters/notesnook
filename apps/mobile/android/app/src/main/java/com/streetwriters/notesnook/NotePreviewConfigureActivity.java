package com.streetwriters.notesnook;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class NotePreviewConfigureActivity extends ReactActivity {

    static int appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID;
    static NotePreviewConfigureActivity activity;

    /**
     * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
     * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
     * (aka React 18) with two boolean flags.
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
                this,
                getMainComponentName(),
                // If you opted-in for the New Architecture, we enable the Fabric Renderer.
                DefaultNewArchitectureEntryPoint.getFabricEnabled(), // fabricEnabled
                // If you opted-in for the New Architecture, we enable Concurrent React (i.e. React 18).
                DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled() // concurrentRootEnabled
        );
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);
        activity = this;
        readAppWidgetId(getIntent());
    }

    /**
     * We launch as singleTask, so configuring a second widget while this screen is still alive
     * arrives here rather than in onCreate(). Without this the activity would keep writing to
     * whichever widget it happened to be opened for first.
     */
    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        activity = this;
        readAppWidgetId(intent);
    }

    private void readAppWidgetId(Intent intent) {
        Bundle extras = intent != null ? intent.getExtras() : null;
        int appWidgetId = extras != null
                ? extras.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                : AppWidgetManager.INVALID_APPWIDGET_ID;

        NotePreviewConfigureActivity.appWidgetId = appWidgetId;
        Intent resultValue = new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        setResult(Activity.RESULT_CANCELED, resultValue);
    }

    public static void saveAndFinish(Context context) {
        if (NotePreviewConfigureActivity.activity == null || appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) return;
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        NotePreviewWidget.updateAppWidget(context, appWidgetManager, appWidgetId);
        Intent resultValue = new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        NotePreviewConfigureActivity.activity.setResult(RESULT_OK, resultValue);
        NotePreviewConfigureActivity.activity.finish();
    }

    @Override
    protected String getMainComponentName() {
        return "NotePreviewConfigure";
    }

}