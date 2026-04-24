const toggleBtn = document.getElementById('toggle');
const statusEl = document.getElementById('status');
const lastGestureEl = document.getElementById('lastGesture');

function render(state) {
  const running = !!state.running;
  toggleBtn.textContent = running ? 'Stop' : 'Start';
  toggleBtn.classList.toggle('running', running);
  statusEl.textContent = state.status || (running ? 'running' : 'idle');
  if (state.lastGesture) {
    const age = Math.max(0, Date.now() - (state.lastGesture.at || 0));
    const secs = Math.floor(age / 1000);
    lastGestureEl.textContent = `${state.lastGesture.type} (${secs}s ago)`;
  } else {
    lastGestureEl.textContent = '—';
  }
}

async function refresh() {
  const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  render(state || {});
}

async function isCameraGranted() {
  try {
    const result = await navigator.permissions.query({ name: 'camera' });
    return result.state === 'granted';
  } catch {
    return false;
  }
}

toggleBtn.addEventListener('click', async () => {
  const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  if (!state.running) {
    const granted = await isCameraGranted();
    if (!granted) {
      chrome.tabs.create({ url: chrome.runtime.getURL('permissions.html') });
      return;
    }
  }
  const res = await chrome.runtime.sendMessage({ type: 'TOGGLE_RUNNING' });
  if (res) render({ ...(await chrome.runtime.sendMessage({ type: 'GET_STATE' })) });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  refresh();
});

refresh();
setInterval(refresh, 1000);
