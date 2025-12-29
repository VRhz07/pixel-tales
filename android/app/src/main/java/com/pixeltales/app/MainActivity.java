package com.pixeltales.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        // Register plugins BEFORE calling super.onCreate()
        // This is the correct order for Capacitor 7+
        registerPlugin(MediaNotificationPlugin.class);
        registerPlugin(AndroidTtsVoicesPlugin.class);
        
        super.onCreate(savedInstanceState);
    }
}
