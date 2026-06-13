const toggleBtn = document.getElementById('toggle');
const grantBtn = document.getElementById('grant');
const statusEl = document.getElementById('status');
const lastGestureEl = document.getElementById('lastGesture');

function render(state) {
  const running = !!state.running;
  const needsPermission = !!state.needsPermission;

  toggleBtn.textContent = running ? 'Stop' : 'Start';
  toggleBtn.classList.toggle('running', running);
  grantBtn.hidden = !needsPermission;

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
