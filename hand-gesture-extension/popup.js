const toggleBtn = document.getElementById('toggle');
const grantBtn = document.getElementById('grant');
const statusEl = document.getElementById('status');
const cameraStateEl = document.getElementById('cameraState');
const lastGestureEl = document.getElementById('lastGesture');

function render(state) {
  const running = !!state.running;
  const cameraGranted = !!state.cameraGranted;

  toggleBtn.textContent = running ? 'Stop' : 'Start';
  toggleBtn.classList.toggle('running', running);

  cameraStateEl.textContent = cameraGranted ? 'granted ✓' : 'not granted';
  cameraStateEl.style.color = cameraGranted ? '#6ddc8a' : '#ff7a6b';

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

toggleBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'TOGGLE_RUNNING' });
  await refresh();
});

grantBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'OPEN_PERMISSION' });
  window.close();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  refresh();
});

refresh();
setInterval(refresh, 1000);
