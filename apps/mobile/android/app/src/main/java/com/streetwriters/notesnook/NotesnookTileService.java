package com.streetwriters.notesnook;

import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

import androidx.annotation.RequiresApi;

@RequiresApi(api = Build.VERSION_CODES.N)
public class NotesnookTileService extends TileService {
    @SuppressLint("StartActivityAndCollapseDeprecated")
    @Override
    public void onClick() {
        super.onClick();
        Intent intent = new Intent(this.getApplicationContext(), ShareActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startActivityAndCollapse(
                    PendingIntent.getActivity(
                            this.getApplicationContext(),
                            0,
                            intent,
                            PendingIntent.FLAG_IMMUTABLE
                    )
            );
        } else {
            startActivityAndCollapse(intent);
        }
    }
}
