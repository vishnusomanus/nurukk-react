import type { CapacitorConfig } from '@capacitor/cli'

type CapAppRole = 'buyer' | 'seller' | 'delivery'

const apps: Record<
  CapAppRole,
  {
    appId: string
    appName: string
    webDir: string
    iosPath: string
    androidPath: string
    backgroundColor: string
  }
> = {
  buyer: {
    appId: 'com.candlestack.nurukk.buyer',
    appName: 'nurukk',
    webDir: 'dist-buyer',
    iosPath: 'ios-buyer',
    androidPath: 'android-buyer',
    backgroundColor: '#fbf9fa',
  },
  seller: {
    appId: 'com.candlestack.nurukk.seller',
    appName: 'nurukk Seller',
    webDir: 'dist-seller',
    iosPath: 'ios-seller',
    androidPath: 'android-seller',
    backgroundColor: '#fbf9fa',
  },
  delivery: {
    appId: 'com.candlestack.nurukk.delivery',
    appName: 'nurukk Delivery',
    webDir: 'dist-delivery',
    iosPath: 'ios-delivery',
    androidPath: 'android-delivery',
    backgroundColor: '#eef2ec',
  },
}

const raw = String(process.env.CAP_APP ?? 'buyer')
  .trim()
  .toLowerCase()
const role: CapAppRole =
  raw === 'seller' || raw === 'delivery' || raw === 'buyer' ? raw : 'buyer'
const selected = apps[role]

const config: CapacitorConfig = {
  appId: selected.appId,
  appName: selected.appName,
  webDir: selected.webDir,
  backgroundColor: selected.backgroundColor,
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'checkout.razorpay.com',
      'api.razorpay.com',
      '*.razorpay.com',
      '*.cashfree.com',
      'sdk.cashfree.com',
    ],
  },
  ios: {
    path: selected.iosPath,
    contentInset: 'never',
  },
  android: {
    path: selected.androidPath,
    backgroundColor: selected.backgroundColor,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: selected.backgroundColor,
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      // Do NOT include alert/banner/list — Cap would post a system notification
      // in the foreground on top of our LocalNotifications (duplicate tray).
      // Background/killed still uses the FCM `notification` payload (OS tray).
      presentationOptions: ['badge', 'sound'],
    },
    LocalNotifications: {
      presentationOptions: ['badge', 'sound', 'alert', 'banner', 'list'],
    },
  },
}

export default config
