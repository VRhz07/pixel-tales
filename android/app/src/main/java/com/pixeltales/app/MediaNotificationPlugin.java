package com.pixeltales.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.media.session.MediaButtonReceiver;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "MediaNotification",
    permissions = {
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
    }
)
public class MediaNotificationPlugin extends Plugin {

    private static final String CHANNEL_ID = "tts_playback_channel";
    private static final int NOTIFICATION_ID = 1001;
    private MediaSessionCompat mediaSession;
    private NotificationManager notificationManager;

    @Override
    public void load() {
        super.load();
        notificationManager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
        setupMediaSession();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Story Playback";
            String description = "Controls for story narration";
            int importance = NotificationManager.IMPORTANCE_LOW;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.setShowBadge(false);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private void setupMediaSession() {
        mediaSession = new MediaSessionCompat(getContext(), "PixelTalesMediaSession");
        mediaSession.setFlags(
            MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
            MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
        );

        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                super.onPlay();
                notifyListeners("play", new JSObject());
                updatePlaybackState(PlaybackStateCompat.STATE_PLAYING);
            }

            @Override
            public void onPause() {
                super.onPause();
                notifyListeners("pause", new JSObject());
                updatePlaybackState(PlaybackStateCompat.STATE_PAUSED);
            }

            @Override
            public void onStop() {
                super.onStop();
                notifyListeners("stop", new JSObject());
                updatePlaybackState(PlaybackStateCompat.STATE_STOPPED);
                hideNotification();
            }

            @Override
            public void onSkipToNext() {
                super.onSkipToNext();
                notifyListeners("next", new JSObject());
            }

            @Override
            public void onSkipToPrevious() {
                super.onSkipToPrevious();
                notifyListeners("previous", new JSObject());
            }
        });

        mediaSession.setActive(true);
    }

    private void updatePlaybackState(int state) {
        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY |
                PlaybackStateCompat.ACTION_PAUSE |
                PlaybackStateCompat.ACTION_STOP |
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
            )
            .setState(state, 0, 1.0f);

        mediaSession.setPlaybackState(stateBuilder.build());
    }

    @PluginMethod
    public void showNotification(PluginCall call) {
        // Check notification permission for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) 
                != PackageManager.PERMISSION_GRANTED) {
                // Request permission
                requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
                return;
            }
        }
        
        showNotificationInternal(call);
    }
    
    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        if (getPermissionState("notifications") == PermissionState.GRANTED) {
            showNotificationInternal(call);
        } else {
            call.reject("Notification permission denied");
        }
    }
    
    private void showNotificationInternal(PluginCall call) {
        String title = call.getString("title", "Pixel Tales");
        String text = call.getString("text", "Playing story...");
        boolean isPlaying = call.getBoolean("isPlaying", true);

        Intent intent = getContext().getPackageManager().getLaunchIntentForPackage(getContext().getPackageName());
        PendingIntent contentIntent = PendingIntent.getActivity(
            getContext(),
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(contentIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW);

        // Add media style
        androidx.media.app.NotificationCompat.MediaStyle mediaStyle =
            new androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2);

        builder.setStyle(mediaStyle);

        // Add action buttons
        if (isPlaying) {
            builder.addAction(createAction("Pause", "pause", android.R.drawable.ic_media_pause));
        } else {
            builder.addAction(createAction("Play", "play", android.R.drawable.ic_media_play));
        }
        
        builder.addAction(createAction("Stop", "stop", android.R.drawable.ic_delete));

        notificationManager.notify(NOTIFICATION_ID, builder.build());

        updatePlaybackState(isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED);

        call.resolve();
    }

    @PluginMethod
    public void hideNotification(PluginCall call) {
        hideNotification();
        call.resolve();
    }

    private void hideNotification() {
        notificationManager.cancel(NOTIFICATION_ID);
        updatePlaybackState(PlaybackStateCompat.STATE_STOPPED);
    }

    @PluginMethod
    public void updateNotification(PluginCall call) {
        showNotification(call);
    }

    private NotificationCompat.Action createAction(String title, String action, int icon) {
        Intent intent = new Intent(getContext(), MediaButtonReceiver.class);
        intent.setAction("com.pixeltales.app." + action.toUpperCase());
        
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            getContext(),
            action.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Action.Builder(icon, title, pendingIntent).build();
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (mediaSession != null) {
            mediaSession.release();
        }
        hideNotification();
    }
}
