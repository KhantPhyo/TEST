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

toggleBtn.addEventListener('click', async () => {
  const res = await chrome.runtime.sendMessage({ type: 'TOGGLE_RUNNING' });
  if (res) render({ ...(await chrome.runtime.sendMessage({ type: 'GET_STATE' })) });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  refresh();
});

refresh();
setInterval(refresh, 1000);
