# Mobile (DaingApp) Grade / Scan Flow – for Web Implementation

This doc summarizes how the mobile app’s “Scan Fish” (grade) flow works so the same behavior can be implemented on the web Grade page.

## Overview

- **Entry:** User goes to Scan from Home.
- **Modes:** Live camera, or pick from gallery.
- **Flow:** Capture/pick image → Preview → Analyze (POST to backend) → Show result image (annotated). Optionally “Scan Another” to reset.

## 1. Screens / States (ScanScreen)

1. **Live camera**
   - Full-screen `CameraView` (expo-camera).
   - Capture button (take picture).
   - Gallery button (pick image from library).
   - Optional: thumbnail of latest history entry (tap → History).

2. **Preview (after capture or pick)**
   - Shows the selected image.
   - Buttons: **Retake** (clear and go back to camera), **Analyze** (send to backend).

3. **Result**
   - Shows the annotated image returned by the backend.
   - Button: **Scan Another** (reset and go back to camera).

## 2. Camera / Image (mobile)

- **Take picture:** `takePicture(cameraRef)` in `utils/camera.ts`:
  - `cameraRef.current.takePictureAsync()` → photo URI.
  - Resize to width 800, compress 0.7, JPEG.
  - Returns manipulated image URI.
- **Pick image:** `ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: false, quality: 1 })` → set `capturedImage` to `result.assets[0].uri`.

## 3. API (mobile)

- **Analyze:** `analyzeFish(imageUri, serverUrls.analyze)` in `services/api.ts`:
  - Builds `FormData`, appends `file` with `{ uri, name: "fish.jpg", type: "image/jpeg" }` (React Native style).
  - `POST` to `{serverBaseUrl}/analyze`.
  - `responseType: "blob"`.
  - Converts blob to data URL (base64) and returns that string so the app can display the result image.
- **URLs:** From `getServerUrls(serverBaseUrl)` in `constants/config.ts`:
  - `analyze`: `{base}/analyze`
  - (Also `uploadDataset`, `history` for other features.)

## 4. Backend (shared)

- **POST /analyze** (in `server.py`):
  - Accepts multipart `file` (image).
  - Runs YOLO model on the image, draws boxes, encodes as JPEG.
  - Optionally uploads annotated image to Cloudinary and adds to history.
  - Returns the annotated image as streaming response (image/jpeg).

## 5. What to replicate on Web (Grade page)

- **Left:** Upload area (file input) and/or camera capture (e.g. `getUserMedia` + canvas to get a blob/File).
- **Right:** Example daing carousel (already present); keep as reference.
- **Flow:**
  1. User selects file or captures from camera.
  2. Show preview of selected/captured image.
  3. Buttons: “Retake” / “Clear” and “Analyze”.
  4. On “Analyze”: `POST /analyze` with the image (FormData, `file` field), same as mobile.
  5. Backend returns image/jpeg (blob). Display it (e.g. via object URL or blob URL) as the “result” image.
  6. “Scan Another” / “Reset” clears preview and result and goes back to upload/camera.
- **API:** Reuse existing `analyzeImage(file)` in `services/api.ts` (POST `/analyze`, blob response) and show the returned blob as the result image.
- **Optional:** Show latest history entry (e.g. from GET /history) as a thumbnail/link like on mobile.

## 6. Differences Web vs Mobile

| Aspect        | Mobile                          | Web (to implement)                    |
|---------------|----------------------------------|---------------------------------------|
| Camera        | expo-camera `CameraView`        | `navigator.mediaDevices.getUserMedia` + `<video>` + canvas snapshot |
| Image source  | URI (file/gallery)              | `File` or blob from input/canvas      |
| Send to API   | FormData with `{ uri, name, type }` | FormData with `File` (same endpoint) |
| Result display| Data URL from blob              | Object URL from blob (or similar)     |
| History       | Optional thumbnail from /history| Optional: same GET /history           |

## 7. Files to reference (mobile)

- `DaingApp/app/index.tsx` – state, handlers (`handleTakePicture`, `handlePickImage`, `handleAnalyzeFish`, `handleReset`), screen routing.
- `DaingApp/components/ScanScreen.tsx` – UI for camera, preview, result.
- `DaingApp/utils/camera.ts` – `takePicture`, resize/compress.
- `DaingApp/services/api.ts` – `analyzeFish` (FormData, POST, blob → data URL).

The web Grade page already has upload + camera toggle and calls `analyzeImage`; align the UX (preview → Analyze → result image + “Scan Another”) with the mobile flow above.
