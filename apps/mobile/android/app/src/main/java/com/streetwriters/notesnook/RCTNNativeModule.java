package com.streetwriters.notesnook;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
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
import java.util.Set;


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

    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean isGestureNavigationEnabled() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                String navBarMode = Settings.Secure.getString(
                        mContext.getContentResolver(),
                        "navigation_mode"
                );
                return "2".equals(navBarMode);
            } catch (Exception e) {
                return false;
            }
        } else {
            return false;
        }
    }

    @ReactMethod
    public void addShortcut(final String id, final String type, final String title, final String description, Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("UNSUPPORTED", "Pinned launcher shortcuts require Android 8.0 or higher");
            return;
        }

        try {
            ShortcutManager shortcutManager = mContext.getSystemService(ShortcutManager.class);
            if (shortcutManager == null) {
                promise.reject("ERROR", "ShortcutManager not available");
                return;
            }

            String uri = "https://app.notesnook.com/open_" + type + "?id=" + id;
            Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(uri));
            intent.setPackage(mContext.getPackageName());

            Icon icon = createLetterIcon(type, title);
            ShortcutInfo shortcut = new ShortcutInfo.Builder(mContext, id)
                    .setShortLabel(title)
                    .setLongLabel(description != null && !description.isEmpty() ? description : title)
                    .setIcon(icon)
                    .setCategories(Set.of(type))
                    .setIntent(intent)
                    .build();

            shortcutManager.requestPinShortcut(shortcut, null);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void removeShortcut(final String id, Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("UNSUPPORTED", "Pinned launcher shortcuts require Android 8.0 or higher");
            return;
        }

        try {
            ShortcutManager shortcutManager = mContext.getSystemService(ShortcutManager.class);
            if (shortcutManager == null) {
                promise.reject("ERROR", "ShortcutManager not available");
                return;
            }

            shortcutManager.disableShortcuts(java.util.Collections.singletonList(id));
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void updateShortcut(final String id, final String title, final String description, Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("UNSUPPORTED", "Pinned launcher shortcuts require Android 8.0 or higher");
            return;
        }

        try {
            ShortcutManager shortcutManager = mContext.getSystemService(ShortcutManager.class);
            if (shortcutManager == null) {
                promise.reject("ERROR", "ShortcutManager not available");
                return;
            }

            // Get existing shortcut to preserve icon and intent
            List<ShortcutInfo> shortcuts = shortcutManager.getPinnedShortcuts();
            ShortcutInfo existingShortcut = null;
            for (ShortcutInfo s : shortcuts) {
                if (s.getId().equals(id)) {
                    existingShortcut = s;
                    break;
                }
            }

            if (existingShortcut == null) {
                return;
            }

            ShortcutInfo updatedShortcut = new ShortcutInfo.Builder(mContext, id)
                    .setShortLabel(title)
                    .setLongLabel(description != null && !description.isEmpty() ? description : title)
                    .setIntent(existingShortcut.getIntent())
                    .build();

            shortcutManager.updateShortcuts(java.util.Collections.singletonList(updatedShortcut));
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void removeAllShortcuts(Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("UNSUPPORTED", "Pinned launcher shortcuts require Android 8.0 or higher");
            return;
        }

        try {
            ShortcutManager shortcutManager = mContext.getSystemService(ShortcutManager.class);
            if (shortcutManager == null) {
                promise.reject("ERROR", "ShortcutManager not available");
                return;
            }

            List<ShortcutInfo> pinnedShortcuts = shortcutManager.getPinnedShortcuts();
            if (!pinnedShortcuts.isEmpty()) {
                List<String> ids = new ArrayList<>();
                for (ShortcutInfo shortcut : pinnedShortcuts) {
                    ids.add(shortcut.getId());
                }
                shortcutManager.disableShortcuts(ids);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getAllShortcuts(Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        ShortcutManager shortcutManager = mContext.getSystemService(ShortcutManager.class);
        WritableArray shortcuts = Arguments.createArray();
        List<ShortcutInfo> infos = shortcutManager.getPinnedShortcuts();

        for (ShortcutInfo info: infos) {
            WritableMap data = Arguments.createMap();
            data.putString("id", info.getId());
            if (info.getShortLabel() != null) {
                data.putString("title", info.getShortLabel().toString());
            }

            if (info.getLongLabel() != null) {
                data.putString("description", info.getLongLabel().toString());
            }


            if (!Objects.requireNonNull(info.getCategories()).isEmpty()) {
                if (info.getCategories().contains("note")) {
                    data.putString("type", "note");
                } else if (info.getCategories().contains("notebook")) {
                    data.putString("type", "notebook");
                } else if (info.getCategories().contains("tag")) {
                    data.putString("type", "tag");
                }
            }
            shortcuts.pushMap(data);
        }
        promise.resolve(shortcuts);
    }

    private Icon createLetterIcon(String type, String title) {

        String letter = type.contains("tag") ? "#" : title != null && !title.isEmpty()
                ? title.substring(0, 1).toUpperCase()
                : "?";
        int color = getColorForLetter(letter);
        
        if (type.equals("notebook")) return Icon.createWithResource(mContext, R.drawable.ic_notebook);
        // Use a larger canvas and fill it completely to avoid white borders from launcher masking.
        int iconSize = 256;
        Bitmap bitmap = Bitmap.createBitmap(iconSize, iconSize, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);



        Paint textPaint = new Paint();
        textPaint.setColor(color);
        textPaint.setTextSize(130);
        textPaint.setAntiAlias(true);
        textPaint.setTextAlign(Paint.Align.CENTER);
        textPaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));

        float x = iconSize / 2f;
        float y = (iconSize / 2f) - ((textPaint.descent() + textPaint.ascent()) / 2f);

        canvas.drawText(letter, x, y, textPaint);

        return Icon.createWithBitmap(bitmap);
    }

    private int getColorForLetter(String letter) {
        int[] colors = {
            0xFF1976D2, // Blue
            0xFFD32F2F, // Red
            0xFF388E3C, // Green
            0xFFF57C00, // Orange
            0xFF7B1FA2, // Purple
            0xFF0097A7, // Cyan
            0xFFC2185B, // Pink
            0xFF455A64, // Blue Grey
            0xFF6A1B9A, // Deep Purple
            0xFF00796B, // Teal
            0xFF512DA8, // Indigo
            0xFF1565C0  // Dark Blue
        };
        
        int hash = Math.abs(letter.hashCode());
        return colors[hash % colors.length];
    }

}
