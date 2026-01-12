import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pixeltales.app',
  appName: 'Pixel Tales',
  webDir: 'frontend/dist',
  server: {
  androidScheme: 'https',  // ✅ For production
  cleartext: false         // ✅ Disable cleartext for security
},
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a0d2e',
      overlaysWebView: false
    },
    NavigationBar: {
      color: '#00000000', // Transparent
      style: 'dark'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a0d2e',
      showSpinner: false
    },
    Keyboard: {
      resize: 'none',
      style: 'dark',
      resizeOnFullScreen: true
    },
    Camera: {
      presentationStyle: 'fullscreen'
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  }
};

export default config;
