# Hand Gesture Navigator

A Chrome extension that watches your webcam for hand gestures and turns them
into browsing and video-playback controls.

## Gestures

| Gesture        | Default mode   | Video mode (when a video is playing)        |
| -------------- | -------------- | -------------------------------------------- |
| Swipe **Up**   | Scroll up      | Volume **up** (+10%)                         |
| Swipe **Down** | Scroll down    | Volume **down** (−10%)                       |
| Swipe **Left** | Browser back   | Rewind **5s** (left-arrow behavior)          |
| Swipe **Right**| Browser forward| Seek forward **5s** (right-arrow behavior)   |

The extension switches automatically between modes: if a visible `<video>`
element is on the page, it is treated as video mode. Otherwise, browser
navigation mode is used.

## Install

1. Clone this repo.
2. From this folder, run:

   ```bash
   ./setup.sh
   ```

   This downloads the MediaPipe Hands model/WASM files into
   `lib/mediapipe/` (these are not checked into git).

3. Open `chrome://extensions` in Chrome or any Chromium-based browser
   (Edge, Brave, Arc…).
4. Enable **Developer mode** (top-right).
5. Click **Load unpacked** and pick the `hand-gesture-extension/` folder.
6. Pin the extension, click its icon, press **Start**. Grant the camera
   permission when prompted.

The first time you Start, Chrome will ask for camera access for the
extension — this is the offscreen document requesting it. Allow it and the
setting is remembered.

## How it works

- `manifest.json` registers a service worker, content script and offscreen
  document. Manifest v3.
- `background.js` owns the on/off state and manages the offscreen document.
  When a gesture is detected it forwards the event to the active tab's
  content script; for history navigation (`SWIPE_LEFT`/`SWIPE_RIGHT` in
  non-video mode) it falls back to `chrome.tabs.goBack / goForward`, which
  works even on pages where content scripts can't run (e.g. `chrome://`).
- `offscreen.html` runs in a hidden document with `USER_MEDIA` reason. It
  starts the webcam, runs MediaPipe Hands locally (WASM), and feeds hand
  landmarks to `gesture-detector.js`.
- `gesture-detector.js` keeps a short rolling history of wrist positions,
  computes a motion vector, and emits a `SWIPE_*` event when the motion is
  fast enough and dominant on one axis. A ~900ms cooldown prevents repeats.
- `content.js` receives gestures on the page, finds the most prominent
  visible video, and applies volume/seek directly on the element. When no
  video is present it just scrolls the page.

## Tuning

Open `gesture-detector.js` to tweak sensitivity:

- `MIN_SPEED` — how fast your hand must move.
- `MIN_TRAVEL` — how far across the frame your hand must travel.
- `DIRECTION_RATIO` — how "straight" the motion must be to count as a swipe.
- `COOLDOWN_MS` — delay between accepted gestures.

## Privacy

All vision processing runs locally inside the offscreen document. No
webcam frames or landmarks ever leave your machine.
