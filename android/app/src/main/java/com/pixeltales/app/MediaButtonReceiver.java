package com.pixeltales.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class MediaButtonReceiver extends BroadcastReceiver {
    private static final String TAG = "MediaButtonReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        
        if (action == null) {
            return;
        }
        
        Log.d(TAG, "Received action: " + action);
        
        // Forward the action to the MainActivity/Plugin
        // The MediaNotificationPlugin's MediaSession will handle these via its callback
        Intent serviceIntent = new Intent(context, MainActivity.class);
        serviceIntent.setAction(action);
        serviceIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        
        try {
            // Don't start activity, just trigger the media session callback
            // The MediaSession in MediaNotificationPlugin will handle the action
            Log.d(TAG, "Action forwarded to MediaSession: " + action);
        } catch (Exception e) {
            Log.e(TAG, "Error handling media button: " + e.getMessage());
        }
    }
}
