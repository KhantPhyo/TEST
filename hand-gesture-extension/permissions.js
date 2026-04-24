const grantBtn = document.getElementById('grant');
const statusEl = document.getElementById('status');

grantBtn.addEventListener('click', async () => {
  grantBtn.disabled = true;
  statusEl.textContent = 'Waiting for permission…';
  statusEl.className = '';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach((t) => t.stop());
    statusEl.textContent = 'Camera access granted! Closing…';
    statusEl.className = 'ok';
    setTimeout(() => window.close(), 1200);
  } catch (err) {
    statusEl.className = 'err';
    if (err.name === 'NotAllowedError') {
      statusEl.textContent =
        'Permission denied. Open chrome://settings/content/camera and allow this extension, then try again.';
    } else {
      statusEl.textContent = 'Error: ' + err.message;
    }
    grantBtn.disabled = false;
  }
});
