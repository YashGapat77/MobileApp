# SoulFix (DailyMatch) Deployment Guide

This guide covers how to deploy the SoulFix backend and build the Android application for release.

## 1. Backend Deployment (using Render.com as example)

The backend is built with Python Flask and Socket.IO. For production, we recommend a platform like Render, Heroku, or a VPS (DigitalOcean). Here we use Render (Free Tier available).

### Prerequisites
- A GitHub repository containing this project.

### Steps
1.  **Push your code to GitHub**.
2.  **Create a Web Service on Render**:
    - Connect your GitHub repo.
    - **Root Directory**: `backend`
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `gunicorn -k eventlet -w 1 app:app`
    - **Environment Variables**:
        - `SECRET_KEY`: (Generate a long random string)
        - `FLASK_ENV`: `production`

3.  **Database Note**:
    - By default, the app uses `dailymatch.db` (SQLite).
    - On Render (free tier), the filesystem is **ephemeral**. This means **all data (matches, chats, users) will be wiped** every time the server restarts/redeploys.
    - **For persistent data**, you should switch to a **PostgreSQL** database (Render offers a managed Postgres). You would need to update `models/database.py` to use `psycopg2` or `SQLAlchemy` instead of `sqlite3`.
    - *For testing/demos, SQLite is fine, but data will reset.*

4.  **Get your Backend URL**:
    - Once deployed, you will get a URL like `https://soulfix-backend.onrender.com`.

## 2. Frontend Configuration

Before building the app, you need to point it to your live backend.

1.  **Update API URL**:
    - Open `src/services/api.ts`.
    - Change `API_BASE_URL`:
      ```typescript
      // const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Old
      const API_BASE_URL = 'https://your-app-name.onrender.com/api'; // New Prod URL
      ```
    - Also update `ChatScreen.tsx` for Socket.IO:
      ```typescript
      // const SOCKET_URL = 'http://10.0.2.2:5000';
      const SOCKET_URL = 'https://your-app-name.onrender.com';
      ```

2.  **Update Android Manifest**:
    - Open `android/app/src/main/AndroidManifest.xml`.
    - You can remove `android:usesCleartextTraffic="true"` if your backend is HTTPS (which Render is).

## 3. Generating Android Release Build (APK/AAB)

To modify the app for the Play Store or share with friends without debug mode:

### A. Generate Signing Key
Run this in terminal (Windows):
```powershell
keytool -genkeypair -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
- Place the generated `my-upload-key.keystore` file in `android/app/`.

### B. Configure Gradle
1.  Edit `android/gradle.properties` AND ADD:
    ```properties
    MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
    MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
    MYAPP_UPLOAD_STORE_PASSWORD=your_password
    MYAPP_UPLOAD_KEY_PASSWORD=your_password
    ```

2.  Edit `android/app/build.gradle` signing config:
    ```gradle
    // Add inside android { ... } block:
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ...
        }
    }
    ```

### C. Build
1.  Open terminal in project root.
2.  Run:
    ```powershell
    cd android
    ./gradlew bundleRelease
    ```
    - **Result**: `android/app/build/outputs/bundle/release/app-release.aab` (Upload this to Play Store).
    
    OR for a standard APK to share with friends:
    ```powershell
    ./gradlew assembleRelease
    ```
    - **Result**: `android/app/build/outputs/apk/release/app-release.apk`.

## 4. Run Locally (Production Mode)
If you want to test the release build on your emulator:
```powershell
npx react-native run-android --mode=release
```
