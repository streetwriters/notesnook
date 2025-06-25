package com.streetwriters.notesnook;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import android.widget.RemoteViews;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.gson.Gson;
import com.streetwriters.notesnook.datatypes.Note;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;


public class RCTNNativeModule extends ReactContextBaseJavaModule {
    Intent lastIntent;
    ReactContext mContext;
    static String IntentType = "com.streetwriters.notesnook.IntentType";

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

    @ReactMethod(isBlockingSynchronousMethod = true)
    public int getWidgetId() {
        return NotePreviewConfigureActivity.appWidgetId;
    }

    @ReactMethod
    public void setString(final String storeName, final String key, final String value) {
        SharedPreferences details = getReactApplicationContext().getSharedPreferences(storeName, Context.MODE_PRIVATE);
        SharedPreferences.Editor edit = details.edit();
        edit.putString(key, value);
        edit.apply();
    }

    @ReactMethod
    public void removeString(final String storeName, final String key) {
        SharedPreferences details = getReactApplicationContext().getSharedPreferences(storeName, Context.MODE_PRIVATE);
        SharedPreferences.Editor edit = details.edit();
        edit.remove(key);
        edit.apply();
    }

    @ReactMethod
    public void getString(final String storeName, final String key, Promise promise) {
        SharedPreferences details = getReactApplicationContext().getSharedPreferences(storeName, Context.MODE_PRIVATE);
        String value = details.getString(key, "");
        promise.resolve(value.isEmpty() ? null : value);
    }

    @ReactMethod
    public void saveAndFinish() {
        NotePreviewConfigureActivity.saveAndFinish(mContext);
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public WritableMap getIntent() {
        WritableMap map = Arguments.createMap();
        if (getCurrentActivity() != null) {
            Intent intent = getCurrentActivity().getIntent();
            Bundle extras = getCurrentActivity().getIntent().getExtras();

            if (extras != null && intent != lastIntent) {
                lastIntent = intent;
                if (Objects.equals(extras.getString(IntentType), "NewReminder")) {
                    map.putString(ReminderWidgetProvider.NewReminder, extras.getString(ReminderWidgetProvider.NewReminder));
                } else if (Objects.equals(extras.getString(IntentType), "OpenReminder")) {
                    map.putString(ReminderViewsService.OpenReminderId, extras.getString(ReminderViewsService.OpenReminderId));
                } else if (Objects.equals(extras.getString(IntentType), "OpenNote")) {
                    map.putString(NotePreviewWidget.OpenNoteId, extras.getString(NotePreviewWidget.OpenNoteId));
                }

            }
        }
        return map;
    }

    @ReactMethod
    public void cancelAndFinish() {
        NotePreviewConfigureActivity.activity.setResult(Activity.RESULT_CANCELED);
        NotePreviewConfigureActivity.activity.finish();
    }

    @ReactMethod
    public void getWidgetNotes(Promise promise) {
        SharedPreferences pref = getReactApplicationContext().getSharedPreferences("appPreview", Context.MODE_PRIVATE);
        Map<String, ?> map = pref.getAll();
        WritableArray arr = Arguments.createArray();
        for(Map.Entry<String,?> entry : map.entrySet()){
            if (entry.getKey().equals("remindersList")) continue;
            String value = (String) entry.getValue();
            Gson gson = new Gson();
            Note note = gson.fromJson(value, Note.class);
            arr.pushString(note.getId());
        }
        promise.resolve(arr);
    }

    @ReactMethod
    public void hasWidgetNote(final String noteId, Promise promise) {
        SharedPreferences pref = getReactApplicationContext().getSharedPreferences("appPreview", Context.MODE_PRIVATE);
        Map<String, ?> map = pref.getAll();
        boolean found = false;
        for(Map.Entry<String,?> entry : map.entrySet()){
            String value = (String) entry.getValue();
            if (value.contains(noteId)) {
                found = true;
            }
        }
        promise.resolve(found);
    }
    @ReactMethod
    public void updateWidgetNote(final String noteId, final String data) {
        SharedPreferences pref = getReactApplicationContext().getSharedPreferences("appPreview", Context.MODE_PRIVATE);
        Map<String, ?> map = pref.getAll();
        SharedPreferences.Editor edit = pref.edit();
        ArrayList<String> ids = new ArrayList<>();
        for(Map.Entry<String,?> entry : map.entrySet()) {
            String value = (String) entry.getValue();
            if (value.contains(noteId)) {
                edit.putString(entry.getKey(), data);
                ids.add(entry.getKey());
            }
        }
        edit.apply();
        for (String id: ids) {
            NotePreviewWidget.updateAppWidget(mContext, AppWidgetManager.getInstance(mContext), Integer.parseInt(id));
        }
    }

    @ReactMethod
    public void updateReminderWidget() {
        AppWidgetManager wm = AppWidgetManager.getInstance(mContext);
        int[] ids = wm.getAppWidgetIds(ComponentName.createRelative(mContext.getPackageName(), ReminderWidgetProvider.class.getName()));
        for (int id: ids) {
            Log.d("Reminders", "Updating" + id);
            RemoteViews views = new RemoteViews(mContext.getPackageName(), R.layout.widget_reminders);
            ReminderWidgetProvider.updateAppWidget(mContext, wm, id, views);
            wm.notifyAppWidgetViewDataChanged(id, R.id.widget_list_view);
        }
    }
}
