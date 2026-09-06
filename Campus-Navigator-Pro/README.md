# Campus Navigator Pro

Campus Live Map / Digital Twin for Hindustan Institute of Technology and Science.

## What is included

- 3D interactive campus shell
- Real HITS building/facility names used where publicly verified
- Building selection and entrance stage
- Floor map and room hotspots
- Room/lab/facility search
- Shortest-path graph routing
- Multi-floor route nodes
- Animated 3D route arrows
- FPS-style first-person navigation
- Current-location support in the web runtime
- Responsive desktop/mobile layout
- Capacitor Android packaging
- Automated GitHub Actions APK build
- No paid API keys

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

## Build web app

```bash
npm run build
npm run preview
```

## Build Android APK locally

Install Android Studio and the Android SDK first. Capacitor supports Android 7 / API 24 and newer with a compatible Android WebView. Then:

```bash
npm install
npx cap add android
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

The APK will be created at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Download the APK from GitHub

Every push to `main` that changes the application automatically starts the **Build Android APK** GitHub Actions workflow.

1. Open the repository on GitHub.
2. Open **Actions**.
3. Select **Build Android APK**.
4. Open the latest successful workflow run.
5. Under **Artifacts**, download **Campus-Live-Map-Android-APK**.
6. Extract the downloaded ZIP and install `app-debug.apk` on an Android device.

The workflow also has **Run workflow** enabled so an APK can be rebuilt manually without changing application code.

## Android build architecture

```text
React + Vite
     |
     | npm run build
     v
   dist/
     |
     | Capacitor
     v
Android WebView + Native Android Runtime
     |
     +-- Geolocation plugin
     +-- Web application / Three.js
     +-- Campus routing engine
     v
 app-debug.apk
```

The Android package is generated in CI rather than committed as a large generated `android/` directory. This keeps the repository source-focused while still producing a downloadable APK for every application build.

## Important navigation accuracy note

The application currently uses a calibrated prototype navigation graph. Publicly verified HITS names are used where available, but room-level coordinates and indoor floor-plan geometry must be supplied from authoritative campus floor plans before claiming survey-grade room navigation accuracy.

For production indoor positioning, combine the campus graph with GPS outdoors and a higher-accuracy indoor positioning method such as BLE, Wi-Fi, UWB or inertial/map matching.
