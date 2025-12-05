package com.pixeltales.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class MediaButtonReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        
        if (action == null) {
            return;
        }

        // The MediaNotificationPlugin will handle the callbacks
        // This receiver just captures the broadcast
    }
}
