import 'dotenv/config';

export default {
  expo: {
    name: "expo-app",
    slug: "expo-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "expoapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    extra: {
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      eas: {
        projectId: "dc22c9a1-ec2f-4731-9b7b-64d95282fee4"
      }
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.stikom.expoapp"
    },
    android: {
      // TAMBAHKAN INI - Package name untuk Android
      package: "com.stikom.expoapp",
      versionCode: 1,
      // Adaptive icon config
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      // Permissions yang dibutuhkan
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES"
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ],
      // Tambahkan plugin untuk camera & image picker jika perlu
      [
        "expo-camera",
        {
          cameraPermission: "Allow app to access your camera."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Allow app to access your photos."
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    }
  }
};