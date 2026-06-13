const grantBtn = document.getElementById('grant');
const statusEl = document.getElementById('status');
const preview = document.getElementById('preview');

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.classList.remove('ok', 'err');
  if (cls) statusEl.classList.add(cls);
}

async function request() {
  grantBtn.disabled = true;
  setStatus('requesting…');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 480, height: 360, facingMode: 'user' },
      audio: false
    });
    preview.srcObject = stream;
    setStatus('granted — starting in 2s', 'ok');
    chrome.runtime.sendMessage({ type: 'PERMISSION_GRANTED' }).catch(() => {});
    setTimeout(() => {
      for (const t of stream.getTracks()) t.stop();
      window.close();
    }, 2000);
  } catch (err) {
    grantBtn.disabled = false;
    setStatus('error: ' + (err?.message || err), 'err');
  }
}

grantBtn.addEventListener('click', request);

// auto-trigger once so the prompt appears immediately
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(request, 200);
});
