package com.streetwriters.notesnook;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import com.streetwriters.notesnook.datatypes.Note;

import java.util.HashSet;
import java.util.Set;


public class NotePreviewWidget extends AppWidgetProvider {
    static String OpenNoteId = "com.streetwriters.notesnook.OpenNoteId";
    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager,
                                int appWidgetId) {
        String data = context.getSharedPreferences(WidgetUtils.PREFERENCES, Context.MODE_PRIVATE).getString(String.valueOf(appWidgetId), "");
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.note_widget);

        Note note = WidgetUtils.parseNote(data);
        if (note == null) {
            // Either the widget was never configured, or we lost the note it pointed at (ids
            // reassigned, data cleared). Point it back at the picker rather than leaving the user
            // with an inert widget they can only fix by deleting and re-adding it.
            views.setTextViewText(R.id.widget_title, context.getString(R.string.widget_note_unconfigured_title));
            views.setTextViewText(R.id.widget_body, context.getString(R.string.widget_note_unconfigured_body));
            views.setOnClickPendingIntent(R.id.open_note, getConfigurePendingIntent(context, appWidgetId));
            appWidgetManager.updateAppWidget(appWidgetId, views);
            return;
        }

        views.setTextViewText(R.id.widget_title, note.getTitle());
        views.setTextViewText(R.id.widget_body, note.getHeadline());
        // Once the user shrinks the widget down to a single row there is no room for the preview
        // text, and a clipped half-line of it looks like a rendering glitch.
        views.setViewVisibility(R.id.widget_body,
                hasRoomForBody(appWidgetManager, appWidgetId) ? View.VISIBLE : View.GONE);

        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra(OpenNoteId, note.getId());
        intent.setAction(Intent.ACTION_VIEW);
        intent.putExtra(RCTNNativeModule.IntentType, "OpenNote");
        intent.setData(Uri.parse("nn://note/" + note.getId()));
        PendingIntent pendingIntent = PendingIntent.getActivity(context, appWidgetId, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE, WidgetUtils.getActivityOptionsBundle());
        views.setOnClickPendingIntent(R.id.open_note, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /**
     * Reopens the configure screen for this widget. The launcher's own "reconfigure" gesture is
     * hard to discover and not offered by every launcher, so an unconfigured widget needs its own
     * way back in.
     */
    private static PendingIntent getConfigurePendingIntent(Context context, int appWidgetId) {
        Intent intent = new Intent(context, NotePreviewConfigureActivity.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_CONFIGURE);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        // PendingIntent equality ignores extras, so the widget id has to be the request code for
        // each widget to get its own.
        return PendingIntent.getActivity(context, appWidgetId, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE,
                WidgetUtils.getActivityOptionsBundle());
    }

    /**
     * Height below which the note preview text is dropped, leaving just the title.
     */
    private static final int MIN_HEIGHT_FOR_BODY_DP = 70;

    private static boolean hasRoomForBody(AppWidgetManager appWidgetManager, int appWidgetId) {
        Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
        if (options == null) return true;

        int minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT);
        // Not reported yet (the widget has just been placed): assume there is room.
        return minHeight <= 0 || minHeight >= MIN_HEIGHT_FOR_BODY_DP;
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
        // This used to do nothing at all, so resizing the widget left it rendered for its old size.
        updateAppWidget(context, appWidgetManager, appWidgetId);
    }

    /**
     * The note shown by each widget is stored in the "appPreview" preferences under its widget id.
     * When the system restores our widgets it hands out fresh ids, so unless we move the stored
     * notes over to the new ids the widgets are left permanently blank with no way to recover
     * other than removing and re-adding them.
     *
     * AppWidgetProvider calls onUpdate() with the new ids right after this, which re-renders them.
     */
    @Override
    public void onRestored(Context context, int[] oldWidgetIds, int[] newWidgetIds) {
        super.onRestored(context, oldWidgetIds, newWidgetIds);
        if (oldWidgetIds == null || newWidgetIds == null) return;

        int count = Math.min(oldWidgetIds.length, newWidgetIds.length);
        SharedPreferences preferences = context.getSharedPreferences("appPreview", Context.MODE_PRIVATE);

        // Read everything up front: an old id can collide with the new id of another widget.
        String[] notes = new String[count];
        Set<String> newKeys = new HashSet<>();
        for (int i = 0; i < count; i++) {
            notes[i] = preferences.getString(String.valueOf(oldWidgetIds[i]), "");
            newKeys.add(String.valueOf(newWidgetIds[i]));
        }

        SharedPreferences.Editor edit = preferences.edit();
        for (int i = 0; i < count; i++) {
            String oldKey = String.valueOf(oldWidgetIds[i]);
            if (!newKeys.contains(oldKey)) {
                edit.remove(oldKey);
            }
        }
        for (int i = 0; i < count; i++) {
            if (notes[i].isEmpty()) continue;
            edit.putString(String.valueOf(newWidgetIds[i]), notes[i]);
        }
        edit.apply();
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        super.onDeleted(context, appWidgetIds);
        SharedPreferences.Editor edit = context.getSharedPreferences("appPreview", Context.MODE_PRIVATE).edit();
        for (int id: appWidgetIds) {
            edit.remove(String.valueOf(id));
        }
        edit.apply();
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // There may be multiple widgets active, so update all of them
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
}