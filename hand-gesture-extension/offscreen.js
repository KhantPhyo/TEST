(async function () {
  const statusEl = document.getElementById('status');
  const video = document.getElementById('cam');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  let stream = null;
  let hands = null;
  let running = false;
  let rafId = 0;

  const detector = new self.GestureDetector({
    onGesture: (g) => {
      setStatus(`gesture: ${g.type}`);
      chrome.runtime.sendMessage({ type: 'GESTURE_DETECTED', gesture: g }).catch(() => {});
    }
  });

  function setStatus(text) {
    statusEl.textContent = text;
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status: text }).catch(() => {});
  }

  async function startCamera() {
    if (stream) return stream;
    setStatus('requesting camera…');
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 480, height: 360, facingMode: 'user' },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    setStatus('camera ready');
    return stream;
  }

  function stopCamera() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
      stream = null;
    }
    video.srcObject = null;
  }

  async function initHands() {
    if (hands) return hands;
    if (!self.Hands) {
      setStatus('MediaPipe not loaded — run setup.sh');
      return null;
    }
    setStatus('loading model…');
    hands = new self.Hands({
      locateFile: (file) => chrome.runtime.getURL(`lib/mediapipe/${file}`)
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });
    hands.onResults(onResults);
    await hands.initialize();
    setStatus('model ready');
    return hands;
  }

  function onResults(results) {
    const lms = results?.multiHandLandmarks?.[0];
    if (!lms) {
      detector.pushFrame(null);
      return;
    }
    // Video is drawn mirrored, so mirror x so swipe right = x increasing.
    const mirrored = lms.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z }));
    detector.pushFrame(mirrored);
  }

  async function loop() {
    if (!running) return;
    if (video.readyState >= 2 && hands) {
      try {
        await hands.send({ image: video });
      } catch (err) {
        setStatus('detector error: ' + (err?.message || err));
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  async function start() {
    if (running) return;
    running = true;
    try {
      await startCamera();
      await initHands();
      loop();
      setStatus('running');
    } catch (err) {
      running = false;
      setStatus('error: ' + (err?.message || err));
    }
  }

  function stop() {
    running = false;
    stopCamera();
    detector.reset();
    setStatus('stopped');
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'GESTURE_START') {
      start().finally(() => sendResponse({ ok: true }));
      return true;
    }
    if (msg?.type === 'GESTURE_STOP') {
      stop();
      sendResponse({ ok: true });
      return true;
    }
  });

  // Announce ready and auto-start if state says so.
  chrome.runtime.sendMessage({ type: 'OFFSCREEN_READY' }).catch(() => {});
  const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' }).catch(() => null);
  if (state && state.running) start();
})();
