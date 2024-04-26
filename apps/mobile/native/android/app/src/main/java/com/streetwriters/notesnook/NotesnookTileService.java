package com.streetwriters.notesnook;

import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

import androidx.annotation.RequiresApi;

@RequiresApi(api = Build.VERSION_CODES.N)
public class NotesnookTileService extends TileService {
    @Override
    public void onClick() {
        super.onClick();
        Intent intent = new Intent(this.getApplicationContext(), ShareActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivityAndCollapse(intent);
    }
}
