package com.streetwriters.notesnook;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.IBinder;
import android.util.Log;

public class OnClearFromRecentService extends Service {

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        try {
            SharedPreferences appStateDetails = getApplicationContext().getSharedPreferences("appStateDetails", MODE_PRIVATE);
            SharedPreferences.Editor edit = appStateDetails.edit();
            edit.remove("appState");
            edit.apply();
            stopSelf();
        } catch (UnsatisfiedLinkError | Exception e) {
        }
    }
}