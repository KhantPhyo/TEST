const OFFSCREEN_URL = 'offscreen.html';

let creating = null;

async function hasOffscreenDocument() {
  if ('getContexts' in chrome.runtime) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)]
    });
    return contexts.length > 0;
  }
  return false;
}

async function ensureOffscreen() {
  if (await hasOffscreenDocument()) return;
  if (creating) {
    await creating;
    return;
  }
  creating = chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['USER_MEDIA'],
    justification: 'Process webcam frames for hand gesture detection.'
  });
  await creating;
  creating = null;
}

async function closeOffscreen() {
  if (await hasOffscreenDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

async function setRunning(flag) {
  if (flag) {
    const { cameraGranted } = await chrome.storage.local.get('cameraGranted');
    if (!cameraGranted) {
      await chrome.storage.local.set({
        running: false,
        needsPermission: true,
        status: 'opening camera setup tab…'
      });
      await openPermissionTab();
      return;
    }
    await chrome.storage.local.set({ running: true, status: 'starting…' });
    await ensureOffscreen();
    chrome.runtime.sendMessage({ type: 'GESTURE_START' }).catch(() => {});
  } else {
    await chrome.storage.local.set({ running: false });
    chrome.runtime.sendMessage({ type: 'GESTURE_STOP' }).catch(() => {});
    await closeOffscreen();
  }
}

async function openPermissionTab() {
  const url = chrome.runtime.getURL('permission.html');
  const tabs = await chrome.tabs.query({ url });
  if (tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
    return;
  }
  await chrome.tabs.create({ url });
}

chrome.runtime.onInstalled.addListener(async () => {
  const { running } = await chrome.storage.local.get('running');
  if (running) await setRunning(true);
});

chrome.runtime.onStartup.addListener(async () => {
  const { running } = await chrome.storage.local.get('running');
  if (running) await setRunning(true);
});

async function forwardGestureToActiveTab(gesture) {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.id) return;
  if (tab.url && /^(chrome|edge|about|chrome-extension):/i.test(tab.url)) {
    handleBrowserOnlyGesture(tab, gesture);
    return;
  }
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (g) => {
        return window.__handGestureHandle ? window.__handGestureHandle(g) : { handled: false };
      },
      args: [gesture]
    });
    const handled = res && res.result && res.result.handled;
    if (!handled) handleBrowserOnlyGesture(tab, gesture);
  } catch (err) {
    handleBrowserOnlyGesture(tab, gesture);
  }
}

function handleBrowserOnlyGesture(tab, gesture) {
  switch (gesture.type) {
    case 'SWIPE_LEFT':
      chrome.tabs.goBack(tab.id).catch(() => {});
      break;
    case 'SWIPE_RIGHT':
      chrome.tabs.goForward(tab.id).catch(() => {});
      break;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg?.type) {
      case 'TOGGLE_RUNNING': {
        const { running } = await chrome.storage.local.get('running');
        const next = !running;
        await setRunning(next);
        sendResponse({ running: next });
        break;
      }
      case 'SET_RUNNING':
        await setRunning(!!msg.value);
        sendResponse({ running: !!msg.value });
        break;
      case 'GET_STATE': {
        const state = await chrome.storage.local.get([
          'running',
          'lastGesture',
          'status',
          'needsPermission',
          'cameraGranted'
        ]);
        sendResponse(state);
        break;
      }
      case 'GESTURE_DETECTED':
        await chrome.storage.local.set({ lastGesture: { ...msg.gesture, at: Date.now() } });
        await forwardGestureToActiveTab(msg.gesture);
        sendResponse({ ok: true });
        break;
      case 'STATUS_UPDATE':
        await chrome.storage.local.set({ status: msg.status });
        sendResponse({ ok: true });
        break;
      case 'OFFSCREEN_READY':
        sendResponse({ ok: true });
        break;
      case 'START_FAILED':
        await chrome.storage.local.set({
          running: false,
          needsPermission: msg.reason === 'permission',
          status: msg.reason === 'permission'
            ? 'permission needed'
            : 'error: ' + msg.message
        });
        await closeOffscreen();
        sendResponse({ ok: true });
        break;
      case 'OPEN_PERMISSION':
        await openPermissionTab();
        sendResponse({ ok: true });
        break;
      case 'PERMISSION_GRANTED':
        await chrome.storage.local.set({
          needsPermission: false,
          cameraGranted: true
        });
        await setRunning(true);
        sendResponse({ ok: true });
        break;
      case 'PERMISSION_REVOKED':
        await chrome.storage.local.set({ cameraGranted: false });
        sendResponse({ ok: true });
        break;
    }
  })();
  return true;
});

chrome.action.onClicked.addListener(async () => {
  // action has popup, so this rarely fires, but just in case
  const { running } = await chrome.storage.local.get('running');
  await setRunning(!running);
});
